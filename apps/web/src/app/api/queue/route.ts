import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import postgres from 'postgres';

const QUEUE_DISK_FILE = path.resolve(process.cwd(), 'public/uploads/queue.json');

export interface QueueItemData {
  id: string;
  number: string;
  nickname: string;
  status: string;
  registeredAt: string;
  printCopies?: number;
}

function getDbClient() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return null;
  try {
    return postgres(dbUrl, { connect_timeout: 4, idle_timeout: 10, max: 5 });
  } catch {
    return null;
  }
}

function loadFromDisk(): QueueItemData[] {
  try {
    if (fs.existsSync(QUEUE_DISK_FILE)) {
      const raw = fs.readFileSync(QUEUE_DISK_FILE, 'utf8');
      const data = JSON.parse(raw);
      if (Array.isArray(data)) return data;
    }
  } catch (err) {
    console.error('Gagal membaca queue.json:', err);
  }
  return [];
}

function saveToDisk(items: QueueItemData[]): void {
  try {
    const dir = path.dirname(QUEUE_DISK_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(QUEUE_DISK_FILE, JSON.stringify(items, null, 2), 'utf8');
  } catch (err) {
    console.error('Gagal menyimpan queue.json ke disk:', err);
  }
}

/**
 * GET /api/queue
 * Ambil daftar antrean aktif dari Supabase PostgreSQL (atau disk fallback jika offline)
 */
export async function GET() {
  const sql = getDbClient();

  if (sql) {
    try {
      // Ambil event aktif
      const events = await sql`SELECT id, name, current_queue_number FROM events WHERE is_active = true LIMIT 1`;
      let eventId: string;
      let nextNumber = 1;

      if (events.length === 0) {
        const [newEvent] = await sql`
          INSERT INTO events (name, is_active, current_queue_number)
          VALUES ('Expo Wisuda Jurusan TIK 2026', true, 1)
          RETURNING id, current_queue_number
        `;
        eventId = newEvent.id;
        nextNumber = newEvent.current_queue_number || 1;
      } else {
        eventId = events[0].id;
        nextNumber = events[0].current_queue_number || 1;
      }

      // Ambil seluruh tiket antrean
      const rows = await sql`
        SELECT 
          q.id,
          q.number,
          q.status,
          q.created_at,
          v.nickname
        FROM queue_tickets q
        JOIN visitors v ON q.visitor_id = v.id
        WHERE q.event_id = ${eventId}
        ORDER BY q.number ASC
      `;

      const mapped: QueueItemData[] = rows.map((r: any) => ({
        id: String(r.id),
        number: '#' + String(r.number).padStart(3, '0'),
        nickname: r.nickname || 'Pengunjung',
        status: (r.status || 'QUEUED').toUpperCase(),
        registeredAt: new Date(r.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        printCopies: 1,
      }));

      saveToDisk(mapped);
      return NextResponse.json({
        success: true,
        data: mapped,
        nextNumber,
        source: 'supabase_postgres',
      });
    } catch (err: any) {
      console.warn('PostgreSQL query gagal, beralih ke disk fallback:', err.message);
    }
  }

  // Fallback ke penyimpanan disk lokal jika database tidak terhubung
  const diskData = loadFromDisk();
  let maxNum = 0;
  for (const d of diskData) {
    const num = parseInt(d.number.replace(/\D/g, '') || '0', 10);
    if (num > maxNum) maxNum = num;
  }
  return NextResponse.json({
    success: true,
    data: diskData,
    nextNumber: maxNum + 1,
    source: 'disk_local',
  });
}

/**
 * POST /api/queue
 * Tambah antrean tiket baru ke database ATAU reset urutan nomor ke #001
 */
export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const body = await req.json().catch(() => ({}));
    const isReset = searchParams.get('action') === 'reset_sequence' || body.action === 'reset_sequence';

    const sql = getDbClient();

    // ==========================================
    // AKSI 1: RESET URUTAN KE #001
    // ==========================================
    if (isReset) {
      if (sql) {
        try {
          const events = await sql`SELECT id FROM events WHERE is_active = true LIMIT 1`;
          if (events.length > 0) {
            const eventId = events[0].id;
            // 1. Hapus tiket lama
            await sql`DELETE FROM queue_tickets WHERE event_id = ${eventId}`;
            // 2. Set ulang counter urutan nomor tiket ke 1
            await sql`UPDATE events SET current_queue_number = 1 WHERE id = ${eventId}`;
          } else {
            await sql`
              INSERT INTO events (name, is_active, current_queue_number)
              VALUES ('Expo Wisuda Jurusan TIK 2026', true, 1)
            `;
          }
        } catch (dbErr: any) {
          console.warn('Gagal reset PostgreSQL queue:', dbErr.message);
        }
      }

      // Bersihkan juga queue.json lokal
      saveToDisk([]);

      return NextResponse.json({
        success: true,
        message: 'Urutan antrean berhasil diatur ulang dari #001',
        nextNumber: 1,
        data: [],
      });
    }

    // ==========================================
    // AKSI 2: TAMBAH TIKET BARU
    // ==========================================
    const nickname = (body.nickname || 'Pengunjung').trim();
    let assignedNumInt = 1;
    let newTicketId = body.id || `ticket-${Date.now()}`;

    if (sql) {
      try {
        const events = await sql`SELECT id, current_queue_number FROM events WHERE is_active = true LIMIT 1`;
        let eventId: string;

        if (events.length === 0) {
          const [newEvent] = await sql`
            INSERT INTO events (name, is_active, current_queue_number)
            VALUES ('Expo Wisuda Jurusan TIK 2026', true, 2)
            RETURNING id
          `;
          eventId = newEvent.id;
          assignedNumInt = 1;
        } else {
          eventId = events[0].id;
          assignedNumInt = events[0].current_queue_number || 1;
          // Naikkan counter urutan nomor tiket berikutnya
          await sql`
            UPDATE events 
            SET current_queue_number = ${assignedNumInt + 1} 
            WHERE id = ${eventId}
          `;
        }

        // Simpan pengunjung
        const [vis] = await sql`
          INSERT INTO visitors (event_id, nickname)
          VALUES (${eventId}, ${nickname})
          RETURNING id
        `;

        // Simpan tiket antrean
        const initialStatus = (body.status || 'queued').toLowerCase();
        const [tkt] = await sql`
          INSERT INTO queue_tickets (event_id, visitor_id, number, status)
          VALUES (${eventId}, ${vis.id}, ${assignedNumInt}, ${initialStatus})
          RETURNING id
        `;
        newTicketId = String(tkt.id);
      } catch (dbErr: any) {
        console.warn('Gagal simpan ke Postgres, fallback ke disk:', dbErr.message);
        const diskItems = loadFromDisk();
        let maxNum = 0;
        for (const d of diskItems) {
          const num = parseInt(d.number.replace(/\D/g, '') || '0', 10);
          if (num > maxNum) maxNum = num;
        }
        assignedNumInt = maxNum + 1;
      }
    } else {
      const diskItems = loadFromDisk();
      let maxNum = 0;
      for (const d of diskItems) {
        const num = parseInt(d.number.replace(/\D/g, '') || '0', 10);
        if (num > maxNum) maxNum = num;
      }
      assignedNumInt = maxNum + 1;
    }

    const formattedNumber = '#' + String(assignedNumInt).padStart(3, '0');

    const newItem: QueueItemData = {
      id: newTicketId,
      number: formattedNumber,
      nickname,
      status: (body.status || 'QUEUED').toUpperCase(),
      registeredAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      printCopies: body.printCopies || 1,
    };

    // Perbarui queue.json di disk
    const diskItems = loadFromDisk();
    const updatedDisk = [...diskItems.filter((i) => i.number !== newItem.number), newItem];
    saveToDisk(updatedDisk);

    return NextResponse.json({
      success: true,
      item: newItem,
      nextNumber: assignedNumInt + 1,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * PATCH /api/queue
 * Perbarui status kolom tiket (QUEUED, WAITING, IN_SESSION, PRINT_ORDER, DONE, CANCELLED)
 */
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, number, status } = body;
    if (!status) {
      return NextResponse.json({ success: false, error: 'Status diperlukan' }, { status: 400 });
    }

    const diskItems = loadFromDisk();
    const updated = diskItems.map((item) => {
      const match = (id && item.id === id) || (number && item.number === number);
      if (match) {
        return { ...item, status: status.toUpperCase() };
      }
      return item;
    });
    saveToDisk(updated);

    const sql = getDbClient();
    if (sql) {
      try {
        const numInt = number ? parseInt(String(number).replace(/\D/g, '') || '0', 10) : null;
        if (id && !id.startsWith('manual-') && !id.startsWith('ticket-')) {
          await sql`
            UPDATE queue_tickets 
            SET status = ${status.toLowerCase()}, updated_at = NOW() 
            WHERE id = ${id}
          `;
        } else if (numInt) {
          await sql`
            UPDATE queue_tickets 
            SET status = ${status.toLowerCase()}, updated_at = NOW() 
            WHERE number = ${numInt}
          `;
        }
      } catch (dbErr: any) {
        console.warn('Gagal update status di Postgres, tetap tersimpan di disk:', dbErr.message);
      }
    }

    return NextResponse.json({ success: true, updatedCount: 1 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * DELETE /api/queue
 * Hapus tiket antrean tunggal atau bersihkan seluruh antrean
 */
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const number = searchParams.get('number');
    const isAll = searchParams.get('all') === 'true';

    const sql = getDbClient();

    if (isAll) {
      saveToDisk([]);
      if (sql) {
        try {
          const events = await sql`SELECT id FROM events WHERE is_active = true LIMIT 1`;
          if (events.length > 0) {
            await sql`DELETE FROM queue_tickets WHERE event_id = ${events[0].id}`;
            await sql`UPDATE events SET current_queue_number = 1 WHERE id = ${events[0].id}`;
          }
        } catch {}
      }
      return NextResponse.json({ success: true, message: 'Semua antrean dihapus' });
    }

    const diskItems = loadFromDisk();
    const filtered = diskItems.filter((item) => {
      if (id && item.id === id) return false;
      if (number && item.number === number) return false;
      return true;
    });
    saveToDisk(filtered);

    if (sql) {
      try {
        const numInt = number ? parseInt(String(number).replace(/\D/g, '') || '0', 10) : null;
        if (id && !id.startsWith('manual-')) {
          await sql`DELETE FROM queue_tickets WHERE id = ${id}`;
        } else if (numInt) {
          await sql`DELETE FROM queue_tickets WHERE number = ${numInt}`;
        }
      } catch {}
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
