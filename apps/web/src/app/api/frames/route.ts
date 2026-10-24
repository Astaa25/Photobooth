import { NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';

export interface FrameTemplateItem {
  slug: string;
  name: string;
  desc: string;
  photoCount: number;
  previewType: 'strip' | 'grid' | 'trio' | 'duo' | 'single';
  frameImage: string;
  isCustom?: boolean;
  slotRatio?: '4:3' | '16:9' | '3:2';
  slots?: any[];
}

const DEFAULT_TEMPLATES: FrameTemplateItem[] = [
  {
    slug: 'night-city-strip',
    name: 'NIGHT CITY STRIP',
    desc: 'Dua strip 4 foto (gaya photobooth)',
    photoCount: 4,
    previewType: 'strip',
    frameImage: '/assets/frames/night-city-strip.png',
  },
  {
    slug: 'night-city-grid',
    name: 'NIGHT CITY GRID',
    desc: '4 foto dalam kisi 2x2',
    photoCount: 4,
    previewType: 'grid',
    frameImage: '/assets/frames/night-city-grid.png',
  },
  {
    slug: 'moonlight-trio',
    name: 'MOONLIGHT TRIO',
    desc: '3 foto strip dengan bulan sabit',
    photoCount: 3,
    previewType: 'trio',
    frameImage: '/assets/frames/moonlight-trio.png',
  },
  {
    slug: 'duo-skyline',
    name: 'DUO SKYLINE',
    desc: '2 foto bertingkat untuk berdua',
    photoCount: 2,
    previewType: 'duo',
    frameImage: '/assets/frames/duo-skyline.png',
  },
  {
    slug: 'poster-tunggal',
    name: 'POSTER TUNGGAL',
    desc: '1 foto besar bergaya poster expo',
    photoCount: 1,
    previewType: 'single',
    frameImage: '/assets/frames/poster-tunggal.png',
  },
];

const STORAGE_DIR = path.join(process.cwd(), 'public', 'uploads', 'frames');
const DB_FILE = path.join(STORAGE_DIR, 'custom-frames.json');

async function getCustomFrames(): Promise<FrameTemplateItem[]> {
  try {
    const raw = await fs.readFile(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveCustomFrames(frames: FrameTemplateItem[]): Promise<void> {
  await fs.mkdir(STORAGE_DIR, { recursive: true });
  await fs.writeFile(DB_FILE, JSON.stringify(frames, null, 2), 'utf-8');
}

// GET: Ambil seluruh template (Default + Kustom dari Admin)
export async function GET() {
  const custom = await getCustomFrames();
  return NextResponse.json({
    success: true,
    data: [...DEFAULT_TEMPLATES, ...custom],
  });
}

// POST: Tambah Template Frame Kustom Baru
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, desc, photoCount, previewType, frameImageBase64, slotRatio, slots } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ success: false, error: 'Nama frame wajib diisi' }, { status: 400 });
    }

    const timestamp = Date.now();
    const slug = `custom-${timestamp}`;
    let finalImageUrl = '/assets/frames/night-city-strip.png';

    // Jika admin mengunggah file gambar PNG base64, simpan sebagai file nyata di public/uploads/frames/
    if (frameImageBase64 && typeof frameImageBase64 === 'string' && frameImageBase64.includes('base64,')) {
      await fs.mkdir(STORAGE_DIR, { recursive: true });
      const base64Data = frameImageBase64.split(';base64,').pop() || '';
      const filename = `frame-${timestamp}.png`;
      const filepath = path.join(STORAGE_DIR, filename);
      await fs.writeFile(filepath, Buffer.from(base64Data, 'base64'));
      finalImageUrl = `/uploads/frames/${filename}`;
    } else if (frameImageBase64 && typeof frameImageBase64 === 'string' && frameImageBase64.startsWith('/')) {
      finalImageUrl = frameImageBase64;
    }

    const newFrame: FrameTemplateItem = {
      slug,
      name: name.trim().toUpperCase(),
      desc: desc ? desc.trim() : `${photoCount || 4} foto 4R kustom`,
      photoCount: Number(photoCount) || 4,
      previewType: previewType || 'strip',
      frameImage: finalImageUrl,
      isCustom: true,
      slotRatio: slotRatio || '4:3',
      slots: Array.isArray(slots) ? slots : undefined,
    };

    const existing = await getCustomFrames();
    const updated = [...existing, newFrame];
    await saveCustomFrames(updated);

    return NextResponse.json({
      success: true,
      data: newFrame,
      all: [...DEFAULT_TEMPLATES, ...updated],
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// DELETE: Hapus Template Frame Kustom
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json({ success: false, error: 'Slug tidak diberikan' }, { status: 400 });
    }

    const existing = await getCustomFrames();
    const target = existing.find((f) => f.slug === slug);

    if (target && target.frameImage && target.frameImage.startsWith('/uploads/frames/')) {
      const filename = path.basename(target.frameImage);
      const filepath = path.join(STORAGE_DIR, filename);
      try {
        await fs.unlink(filepath);
      } catch {}
    }

    const filtered = existing.filter((f) => f.slug !== slug);
    await saveCustomFrames(filtered);

    return NextResponse.json({
      success: true,
      all: [...DEFAULT_TEMPLATES, ...filtered],
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
