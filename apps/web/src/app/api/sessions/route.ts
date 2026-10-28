import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import postgres from 'postgres';

const SESSIONS_FILE = path.resolve(process.cwd(), 'public/uploads/sessions.json');
const QUEUE_DISK_FILE = path.resolve(process.cwd(), 'public/uploads/queue.json');

function getDbClient() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return null;
  try {
    return postgres(dbUrl, { connect_timeout: 4, idle_timeout: 10, max: 5 });
  } catch {
    return null;
  }
}

interface CompletedSessionData {
  id: string;
  number: string;
  nickname: string;
  time: string;
  date: string;
  template: string;
  frameImage?: string;
  slots?: { x: number; y: number; width: number; height: number; photo?: number }[];
  canvasWidth?: number;
  canvasHeight?: number;
  photos: { id: number; color: string; label: string }[];
  accentColor: string;
  createdAt: number;
}

function loadSessionsFromDisk(): CompletedSessionData[] {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const raw = fs.readFileSync(SESSIONS_FILE, 'utf8');
      const data = JSON.parse(raw);
      if (Array.isArray(data)) return data;
    }
  } catch (err) {
    console.error('Gagal membaca sessions.json:', err);
  }
  return [];
}

function saveSessionsToDisk(sessions: CompletedSessionData[]): void {
  try {
    const dir = path.dirname(SESSIONS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2), 'utf8');
  } catch (err) {
    console.error('Gagal menyimpan sessions.json:', err);
  }
}

/**
 * GET /api/sessions
 * Ambil semua sesi yang telah selesai difoto (atau filter dengan ?ticket=001)
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ticketQuery = searchParams.get('ticket')?.replace('#', '').trim();

  const sessions = loadSessionsFromDisk();

  if (ticketQuery) {
    const found = sessions.find(
      (s) => s.number.replace('#', '').trim().toLowerCase() === ticketQuery.toLowerCase()
    );
    if (found) {
      return NextResponse.json({ success: true, data: found });
    }
  }

  return NextResponse.json({
    success: true,
    data: sessions,
    total: sessions.length,
  });
}

/**
 * POST /api/sessions
 * Simpan hasil pemotretan sesi bilik foto:
 * 1. Simpan ke sessions.json (galeri publik)
 * 2. Sinkronkan tiket antrean di PostgreSQL & queue.json menjadi 'DONE'
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const cleanNumber = (body.number || '#001').startsWith('#')
      ? body.number
      : `#${body.number}`;
    const numInt = parseInt(cleanNumber.replace(/\D/g, '') || '1', 10);
    const cleanNickname = body.nickname || 'Pengunjung';

    const rawPhotos = Array.isArray(body.photos) ? body.photos : [];
    const formattedPhotos = rawPhotos.map((p: any, idx: number) => {
      if (typeof p === 'string') {
        return {
          id: idx + 1,
          color: p,
          label: `Pose #${idx + 1}`,
        };
      }
      return {
        id: p.id || idx + 1,
        color: p.color || p.url || '#1D4ED8',
        label: p.label || `Pose #${idx + 1}`,
      };
    });

    const newSession: CompletedSessionData = {
      id: body.id || `sess-${Date.now()}`,
      number: cleanNumber,
      nickname: cleanNickname,
      time: body.time || new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      date: body.date || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      template: body.template || 'NIGHT CITY STRIP 4R',
      frameImage: body.frameImage,
      slots: body.slots,
      canvasWidth: body.canvasWidth || 1200,
      canvasHeight: body.canvasHeight || 1800,
      photos: formattedPhotos,
      accentColor: body.accentColor || '#00E599',
      createdAt: Date.now(),
    };

    const currentSessions = loadSessionsFromDisk();
    const filtered = currentSessions.filter((s) => s.number !== newSession.number);
    const updated = [newSession, ...filtered];
    saveSessionsToDisk(updated);

    // ============================================================
    // SINKRONISASI KE DATABASE QUEUE: Tandai Tiket sebagai DONE
    // ============================================================
    const sql = getDbClient();
    if (sql) {
      try {
        const events = await sql`SELECT id FROM events WHERE is_active = true LIMIT 1`;
        if (events.length > 0) {
          const eventId = events[0].id;
          const updatedTkt = await sql`
            UPDATE queue_tickets 
            SET status = 'done', updated_at = NOW() 
            WHERE event_id = ${eventId} AND number = ${numInt}
            RETURNING id
          `;
          if (updatedTkt.length === 0) {
            // Jika tiket belum ada di database, buat langsung sebagai done
            const [vis] = await sql`
              INSERT INTO visitors (event_id, nickname)
              VALUES (${eventId}, ${cleanNickname})
              RETURNING id
            `;
            await sql`
              INSERT INTO queue_tickets (event_id, visitor_id, number, status)
              VALUES (${eventId}, ${vis.id}, ${numInt}, 'done')
              ON CONFLICT DO NOTHING
            `;
          }
        }
      } catch (dbErr: any) {
        console.warn('Gagal sinkron status sesi ke Postgres:', dbErr.message);
      }
    }

    // Perbarui juga queue.json di disk jika ada
    try {
      if (fs.existsSync(QUEUE_DISK_FILE)) {
        const rawQ = fs.readFileSync(QUEUE_DISK_FILE, 'utf8');
        const qData = JSON.parse(rawQ);
        if (Array.isArray(qData)) {
          let found = false;
          const updatedQ = qData.map((item: any) => {
            if (item.number === cleanNumber) {
              found = true;
              return { ...item, status: 'DONE' };
            }
            return item;
          });
          if (!found) {
            updatedQ.push({
              id: `done-${Date.now()}`,
              number: cleanNumber,
              nickname: cleanNickname,
              status: 'DONE',
              registeredAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
              printCopies: 1,
            });
          }
          fs.writeFileSync(QUEUE_DISK_FILE, JSON.stringify(updatedQ, null, 2), 'utf8');
        }
      }
    } catch {}

    return NextResponse.json({
      success: true,
      data: newSession,
      message: 'Sesi foto berhasil disimpan ke galeri publik dan antrean disinkronkan.',
    });
  } catch (err: any) {
    console.error('Gagal menyimpan sesi:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Gagal menyimpan sesi foto.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sessions
 * Hapus atau reset riwayat sesi galeri
 */
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const isAll = searchParams.get('all') === 'true';
    const number = searchParams.get('number');

    if (isAll) {
      saveSessionsToDisk([]);
      return NextResponse.json({ success: true, message: 'Semua sesi galeri dibersihkan' });
    }

    if (number) {
      const current = loadSessionsFromDisk();
      const filtered = current.filter((s) => s.number !== number);
      saveSessionsToDisk(filtered);
      return NextResponse.json({ success: true, message: `Sesi ${number} dihapus` });
    }

    return NextResponse.json({ success: false, error: 'Parameter tidak valid' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
