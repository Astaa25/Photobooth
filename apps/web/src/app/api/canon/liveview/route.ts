import { NextResponse } from 'next/server';

const DIGICAM_BASE_URL = process.env.DIGICAM_BASE_URL || 'http://127.0.0.1:5513';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const res = await fetch(`${DIGICAM_BASE_URL}/liveview.jpg`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(1500),
    });

    if (res.ok) {
      const buffer = await res.arrayBuffer();
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'image/jpeg',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      });
    }

    return new NextResponse(null, { status: 404 });
  } catch (err) {
    return new NextResponse(null, { status: 503 });
  }
}
