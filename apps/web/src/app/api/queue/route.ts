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

const DEFAULT_INITIAL_QUEUE: QueueItemData[] = [
  { id: '1', number: '#001', nickname: 'Diana', status: 'IN_SESSION', registeredAt: '10:14', printCopies: 2 },
  { id: '2', number: '#002', nickname: 'Budi & Sari', status: 'QUEUED', registeredAt: '10:18', printCopies: 1 },
  { id: '3', number: '#003', nickname: 'Kelompok 4 Wisuda', status: 'QUEUED', registeredAt: '10:22', printCopies: 3 },
  { id: '4', number: '#004', nickname: 'Aris', status: 'WAITING', registeredAt: '10:05', printCopies: 1 },
  { id: '5', number: '#005', nickname: 'Rani', status: 'DONE', registeredAt: '09:55', printCopies: 2 },
  { id: '6', number: '#006', nickname: 'Keluarga Dosen TIK', status: 'PRINT_ORDER', registeredAt: '10:30', printCopies: 2 },
];

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
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (err) {
    console.error('Gagal membaca queue.json:', err);
  }
  return DEFAULT_INITIAL_QUEUE;
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
      const events = await sql`SELECT id, name FROM events WHERE is_active = true LIMIT 1`;
      let eventId: string;
      if (events.length === 0) {
        const [newEvent] = await sql`
          INSERT INTO events (name, is_active, current_queue_number)
          VALUES ('Expo Wisuda Jurusan TIK 2026', true, 6)
          RETURNING id
        `;
        eventId = newEvent.id;
      } else {
        eventId = events[0].id;
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

      if (rows.length > 0) {
        const mapped: QueueItemData[] = rows.map((r: any) => ({
          id: String(r.id),
          number: '#' + String(r.number).padStart(3, '0'),
          nickname: r.nickname || 'Pengunjung',
          status: (r.status || 'QUEUED').toUpperCase(),
          registeredAt: new Date(r.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          printCopies: 1,
        }));

        saveToDisk(mapped);
        return NextResponse.json({ success: true, data: mapped, source: 'supabase_postgres' });
      }

      // Jika database masih kosong (0 baris), inisialisasi dengan DEFAULT_INITIAL_QUEUE ke dalam database
      const diskItems = loadFromDisk();
      for (const item of diskItems) {
        const numInt = parseInt(item.number.replace(/\D/g, '') || '1', 10);
        const [vis] = await sql`
          INSERT INTO visitors (event_id, nickname)
          VALUES (${eventId}, ${item.nickname})
          RETURNING id
        `;
        await sql`
          INSERT INTO queue_tickets (event_id, visitor_id, number, status)
          VALUES (${eventId}, ${vis.id}, ${numInt}, ${item.status.toLowerCase()})
          ON CONFLICT DO NOTHING
        `;
      }

      saveToDisk(diskItems);
      return NextResponse.json({ success: true, data: diskItems, source: 'supabase_seeded' });
    } catch (err: any) {
      console.warn('PostgreSQL query gagal, beralih ke disk fallback:', err.message);
    }
  }

  // Fallback ke penyimpanan disk lokal jika database tidak terhubung
  const diskData = loadFromDisk();
  return NextResponse.json({ success: true, data: diskData, source: 'disk_local' });
}

/**
 * POST /api/queue
 * Tambah antrean tiket baru ke database
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const nickname = (body.nickname || 'Pengunjung').trim();
    const diskItems = loadFromDisk();

    // Hitung nomor tiket urut
    let nextNumInt = 1;
    if (diskItems.length > 0) {
      const maxNum = Math.max(...diskItems.map((d) => parseInt(d.number.replace(/\D/g, '') || '0', 10)));
      nextNumInt = maxNum + 1;
    }
    const formattedNumber = body.number || ('#' + String(nextNumInt).padStart(3, '0'));
    const finalNumInt = parseInt(String(formattedNumber).replace(/\D/g, '') || String(nextNumInt), 10);

    const newItem: QueueItemData = {
      id: body.id || `ticket-${Date.now()}`,
      number: formattedNumber,
      nickname,
      status: (body.status || 'QUEUED').toUpperCase(),
      registeredAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      printCopies: body.printCopies || 1,
    };

    const sql = getDbClient();
    if (sql) {
      try {
        const [event] = await sql`SELECT id FROM events WHERE is_active = true LIMIT 1`;
        if (event) {
          const [vis] = await sql`
            INSERT INTO visitors (event_id, nickname)
            VALUES (${event.id}, ${nickname})
            RETURNING id
          `;
          const [tkt] = await sql`
            INSERT INTO queue_tickets (event_id, visitor_id, number, status)
            VALUES (${event.id}, ${vis.id}, ${finalNumInt}, ${newItem.status.toLowerCase()})
            RETURNING id
          `;
          newItem.id = String(tkt.id);
        }
      } catch (dbErr: any) {
        console.warn('Gagal menyimpan tiket ke Postgres, disimpan ke disk:', dbErr.message);
      }
    }

    const updatedDisk = [newItem, ...diskItems.filter((i) => i.number !== newItem.number)];
    saveToDisk(updatedDisk);

    return NextResponse.json({ success: true, item: newItem });
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
 * Hapus tiket antrean
 */
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const number = searchParams.get('number');

    const diskItems = loadFromDisk();
    const filtered = diskItems.filter((item) => {
      if (id && item.id === id) return false;
      if (number && item.number === number) return false;
      return true;
    });
    saveToDisk(filtered);

    const sql = getDbClient();
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
