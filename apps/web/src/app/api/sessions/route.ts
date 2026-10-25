import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

const SESSIONS_FILE = path.resolve(process.cwd(), 'public/uploads/sessions.json');

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
 * Simpan hasil pemotretan sesi bilik foto agar langsung muncul di galeri publik
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const cleanNumber = (body.number || '#001').startsWith('#')
      ? body.number
      : `#${body.number}`;

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
      nickname: body.nickname || 'Pengunjung',
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
    // Gantikan sesi dengan nomor tiket yang sama jika ada, atau tambahkan di awal
    const filtered = currentSessions.filter((s) => s.number !== newSession.number);
    const updated = [newSession, ...filtered];

    saveSessionsToDisk(updated);

    return NextResponse.json({
      success: true,
      data: newSession,
      message: 'Sesi foto berhasil disimpan ke galeri publik.',
    });
  } catch (err: any) {
    console.error('Gagal menyimpan sesi:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Gagal menyimpan sesi foto.' },
      { status: 500 }
    );
  }
}
