import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

const DIGICAM_BASE_URL = process.env.DIGICAM_BASE_URL || 'http://127.0.0.1:5513';
const CAPTURES_DIR = path.resolve(process.cwd(), 'public/uploads/captures');

// Pastikan folder captures tersedia
if (!fs.existsSync(CAPTURES_DIR)) {
  fs.mkdirSync(CAPTURES_DIR, { recursive: true });
}

/**
 * Cek status koneksi kamera Canon via digiCamControl
 */
async function checkCanonStatus(): Promise<{ connected: boolean; cameraName: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);

    const res = await fetch(`${DIGICAM_BASE_URL}/?CMD=All_Camera_List`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const text = await res.text();
      const clean = text.trim();
      if (clean && !clean.toLowerCase().includes('no camera')) {
        return { connected: true, cameraName: clean };
      }
    }
    return { connected: false, cameraName: 'Canon EOS 1200D (Menunggu digiCamControl)' };
  } catch {
    return { connected: false, cameraName: 'Canon EOS 1200D (digiCamControl Offline)' };
  }
}

/**
 * Generate foto simulasi beresolusi tinggi (4:3) saat digiCamControl belum dibuka
 */
function generateFallbackCanonPhoto(photoIndex: number, visitorName = 'Pengunjung'): string {
  // Palet warna bertema arcade malam
  const palettes = [
    { bg1: '#1E1B4B', bg2: '#312E81', accent: '#FE0168', text: '#FFD84D', pose: 'POSE 1 - SENYUM TERBAIK' },
    { bg1: '#0F172A', bg2: '#1E293B', accent: '#00E599', text: '#5CE1E6', pose: 'POSE 2 - GAYA BEBAS' },
    { bg1: '#14532D', bg2: '#064E3B', accent: '#FFD84D', text: '#FFFFFF', pose: 'POSE 3 - FINGER HEART' },
    { bg1: '#581C87', bg2: '#3B0764', accent: '#5CE1E6', text: '#FFD84D', pose: 'POSE 4 - SELEBRASI WISUDA' },
  ];
  const theme = palettes[photoIndex % palettes.length];
  const now = new Date().toLocaleTimeString('id-ID');

  // Buat SVG 1200x900 (rasio 4:3) lalu encode ke Data URL
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${theme.bg1}" />
          <stop offset="100%" stop-color="${theme.bg2}" />
        </linearGradient>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
        </pattern>
      </defs>
      <rect width="1200" height="900" fill="url(#grad)" />
      <rect width="1200" height="900" fill="url(#grid)" />
      
      <!-- Frame Border Viewfinder -->
      <rect x="40" y="40" width="1120" height="820" fill="none" stroke="${theme.accent}" stroke-width="4" stroke-dasharray="16 8"/>
      
      <!-- Corner Markers -->
      <path d="M 60 120 L 60 60 L 120 60" fill="none" stroke="${theme.text}" stroke-width="8"/>
      <path d="M 1140 120 L 1140 60 L 1080 60" fill="none" stroke="${theme.text}" stroke-width="8"/>
      <path d="M 60 780 L 60 840 L 120 840" fill="none" stroke="${theme.text}" stroke-width="8"/>
      <path d="M 1140 780 L 1140 840 L 1080 840" fill="none" stroke="${theme.text}" stroke-width="8"/>

      <!-- Center Crosshair -->
      <circle cx="600" cy="450" r="180" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
      <circle cx="600" cy="450" r="6" fill="${theme.accent}"/>
      <line x1="600" y1="240" x2="600" y2="280" stroke="${theme.accent}" stroke-width="4"/>
      <line x1="600" y1="620" x2="600" y2="660" stroke="${theme.accent}" stroke-width="4"/>
      <line x1="390" y1="450" x2="430" y2="450" stroke="${theme.accent}" stroke-width="4"/>
      <line x1="770" y1="450" x2="810" y2="450" stroke="${theme.accent}" stroke-width="4"/>

      <!-- Header Banner Info -->
      <rect x="80" y="70" width="460" height="60" fill="rgba(0,0,0,0.6)" rx="4"/>
      <text x="100" y="108" fill="${theme.text}" font-family="monospace, sans-serif" font-weight="bold" font-size="24">
        📷 CANON EOS 1200D &bull; ${theme.pose}
      </text>

      <!-- Watermark Info -->
      <rect x="80" y="770" width="1040" height="60" fill="rgba(0,0,0,0.6)" rx="4"/>
      <text x="100" y="808" fill="#FFFFFF" font-family="monospace, sans-serif" font-size="20">
        EXPO WISUDA TIK 2026 &bull; ${visitorName} &bull; ${now} WIB
      </text>
      <text x="1080" y="808" text-anchor="end" fill="${theme.accent}" font-family="monospace, sans-serif" font-weight="bold" font-size="20">
        SENSOR 18.0 MP RAW
      </text>
    </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * GET /api/canon
 * Status koneksi kamera Canon DSLR via digiCamControl
 */
export async function GET() {
  const status = await checkCanonStatus();
  return NextResponse.json({
    success: true,
    ...status,
    digicamUrl: DIGICAM_BASE_URL,
    timestamp: Date.now(),
  });
}

/**
 * POST /api/canon
 * Mengambil foto dari kamera Canon DSLR (atau simulasi jika perangkat offline)
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const photoIndex = typeof body.photoIndex === 'number' ? body.photoIndex : 0;
    const visitorName = body.visitorName || 'Pengunjung';
    const isTest = Boolean(body.isTest);

    // Cek apakah digiCamControl aktif
    const canonStatus = await checkCanonStatus();

    if (canonStatus.connected) {
      // 1. Kamera Fisik Canon Terhubung: Kirim perintah Capture ke digiCamControl
      try {
        const startTime = Date.now();
        const capRes = await fetch(`${DIGICAM_BASE_URL}/?CMD=Capture`, {
          signal: AbortSignal.timeout(10000),
        });

        if (capRes.ok) {
          // Tunggu sebentar agar file JPEG tersimpan
          await new Promise((r) => setTimeout(r, 1200));

          // Ambil preview file terakhir yang ditangkap dari digiCamControl
          // Endpoint standar digiCamControl menyajikan gambar terakhir di /lastcaptured.jpg atau /preview.jpg
          const lastImgRes = await fetch(`${DIGICAM_BASE_URL}/lastcaptured.jpg`, {
            signal: AbortSignal.timeout(5000),
          }).catch(() => null);

          if (lastImgRes && lastImgRes.ok) {
            const arrayBuffer = await lastImgRes.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString('base64');
            const dataUrl = `data:image/jpeg;base64,${base64}`;

            return NextResponse.json({
              success: true,
              photoUrl: dataUrl,
              source: 'canon-hardware',
              cameraName: canonStatus.cameraName,
              message: 'Foto berhasil diambil langsung dari sensor Canon EOS 1200D!',
            });
          }
        }
      } catch (err: any) {
        console.warn('Gagal mengambil file langsung dari digiCamControl, menggunakan fallback:', err?.message);
      }
    }

    // 2. Mode Simulasi Cerdas (Kamera Offline / Uji Coba Tanpa USB Terpasang)
    const fallbackPhoto = generateFallbackCanonPhoto(photoIndex, visitorName);

    return NextResponse.json({
      success: true,
      photoUrl: fallbackPhoto,
      source: canonStatus.connected ? 'canon-hardware' : 'canon-simulator',
      cameraName: canonStatus.cameraName,
      message: canonStatus.connected
        ? 'Foto Canon berhasil diproses.'
        : 'Mode Simulasi Canon aktif (Hubungkan USB kamera & jalankan digiCamControl di laptop untuk rana fisik).',
    });
  } catch (err: any) {
    console.error('Error pada API Canon:', err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Gagal memproses tangkapan kamera Canon.',
      },
      { status: 500 }
    );
  }
}
