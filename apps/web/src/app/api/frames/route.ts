import { NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';

export interface FrameSlotItem {
  x: number;
  y: number;
  width: number;
  height: number;
  photo: number;
}

export interface FrameTemplateItem {
  slug: string;
  name: string;
  desc: string;
  photoCount: number;
  previewType: 'strip' | 'grid' | 'trio' | 'duo' | 'single';
  category?: string;
  tags?: string[];
  bgColor?: string;
  order?: number;
  showInBooth?: boolean;
  frameImage: string;
  isCustom?: boolean;
  slotRatio?: '4:3' | '16:9' | '3:2';
  slots?: FrameSlotItem[];
  canvasWidth?: number;
  canvasHeight?: number;
}

/**
 * Validasi Tata Letak Slot Kanvas 1200x1800 px (Cetak 4R)
 * Mengadopsi aturan TemplateController.php persis sesuai arsitektur Laravel/Next.js:
 * 1. Setiap slot harus berada dalam kanvas 1200x1800 px
 * 2. Nomor foto (photo) harus 0 <= photo < slotCount
 * 3. Setiap foto (0 s/d slotCount-1) harus memiliki minimal 1 slot penempatan
 */
function validateTemplateSlots(
  slots: any[],
  slotCount: number,
  maxW = 1200,
  maxH = 1800
): { valid: boolean; error?: string; cleanSlots?: FrameSlotItem[] } {
  if (!Array.isArray(slots) || slots.length === 0) {
    return { valid: false, error: 'Tata letak harus memiliki minimal 1 slot foto.' };
  }

  const seen: Record<number, boolean> = {};
  const cleanSlots: FrameSlotItem[] = [];

  for (let i = 0; i < slots.length; i++) {
    const s = slots[i];
    const n = i + 1;
    const x = Math.round(Number(s.x) || 0);
    const y = Math.round(Number(s.y) || 0);
    const width = Math.round(Number(s.width) || 0);
    const height = Math.round(Number(s.height) || 0);
    const photo = typeof s.photo === 'number' && !isNaN(s.photo) ? Math.round(s.photo) : i;

    const slot: FrameSlotItem = { x, y, width, height, photo };

    if (
      slot.width < 1 ||
      slot.height < 1 ||
      slot.x < 0 ||
      slot.y < 0 ||
      slot.x + slot.width > maxW ||
      slot.y + slot.height > maxH
    ) {
      return { valid: false, error: `Slot ${n} keluar dari kanvas ${maxW}x${maxH} px.` };
    }

    if (slot.photo < 0 || slot.photo >= slotCount) {
      return {
        valid: false,
        error: `Slot ${n} merujuk foto ke-${slot.photo + 1}, padahal jumlah foto hanya ${slotCount}.`,
      };
    }

    seen[slot.photo] = true;
    cleanSlots.push(slot);
  }

  for (let p = 0; p < slotCount; p++) {
    if (!seen[p]) {
      return { valid: false, error: `Foto ke-${p + 1} belum punya slot di tata letak.` };
    }
  }

  return { valid: true, cleanSlots };
}

const DEFAULT_TEMPLATES: FrameTemplateItem[] = [
  {
    slug: 'night-city-grid',
    name: 'NIGHT CITY GRID',
    desc: 'Empat foto dalam kisi 2×2 dengan latar skyline malam.',
    photoCount: 4,
    previewType: 'grid',
    category: 'Grid',
    tags: ['grid', '4 foto', 'cetak 4R', 'night city'],
    bgColor: '#131947',
    order: 1,
    showInBooth: true,
    frameImage: '/assets/frames/night-city-grid.png',
    canvasWidth: 1200,
    canvasHeight: 1800,
    slots: [
      { x: 50, y: 330, width: 530, height: 600, photo: 0 },
      { x: 620, y: 330, width: 530, height: 600, photo: 1 },
      { x: 50, y: 960, width: 530, height: 600, photo: 2 },
      { x: 620, y: 960, width: 530, height: 600, photo: 3 },
    ],
  },
  {
    slug: 'night-city-strip',
    name: 'NIGHT CITY STRIP',
    desc: 'Dua strip 4 foto photobooth (strip ganda) untuk dipotong dua.',
    photoCount: 4,
    previewType: 'strip',
    category: 'Strip',
    tags: ['strip', 'strip ganda', '4 foto', 'cetak 4R'],
    bgColor: '#0B0D2A',
    order: 2,
    showInBooth: true,
    frameImage: '/assets/frames/night-city-strip.png',
    canvasWidth: 1200,
    canvasHeight: 1800,
    slots: [
      { x: 40, y: 250, width: 520, height: 330, photo: 0 },
      { x: 640, y: 250, width: 520, height: 330, photo: 0 },
      { x: 40, y: 605, width: 520, height: 330, photo: 1 },
      { x: 640, y: 605, width: 520, height: 330, photo: 1 },
      { x: 40, y: 960, width: 520, height: 330, photo: 2 },
      { x: 640, y: 960, width: 520, height: 330, photo: 2 },
      { x: 40, y: 1315, width: 520, height: 330, photo: 3 },
      { x: 640, y: 1315, width: 520, height: 330, photo: 3 },
    ],
  },
  {
    slug: 'moonlight-trio',
    name: 'MOONLIGHT TRIO',
    desc: 'Dua strip 3 foto bertingkat vertikal dengan ornamen bulan sabit.',
    photoCount: 3,
    previewType: 'trio',
    category: 'Trio',
    tags: ['trio', '3 foto', 'bulan sabit'],
    bgColor: '#160078',
    order: 3,
    showInBooth: true,
    frameImage: '/assets/frames/moonlight-trio.png',
    canvasWidth: 1200,
    canvasHeight: 1800,
    slots: [
      { x: 40, y: 250, width: 520, height: 450, photo: 0 },
      { x: 640, y: 250, width: 520, height: 450, photo: 0 },
      { x: 40, y: 725, width: 520, height: 450, photo: 1 },
      { x: 640, y: 725, width: 520, height: 450, photo: 1 },
      { x: 40, y: 1200, width: 520, height: 450, photo: 2 },
      { x: 640, y: 1200, width: 520, height: 450, photo: 2 },
    ],
  },
  {
    slug: 'duo-skyline',
    name: 'DUO SKYLINE',
    desc: '2 foto bertingkat seimbang untuk berdua.',
    photoCount: 2,
    previewType: 'duo',
    category: 'Duo',
    tags: ['duo', '2 foto', 'couple'],
    bgColor: '#131947',
    order: 4,
    showInBooth: true,
    frameImage: '/assets/frames/duo-skyline.png',
    canvasWidth: 1200,
    canvasHeight: 1800,
    slots: [
      { x: 50, y: 260, width: 1100, height: 620, photo: 0 },
      { x: 50, y: 920, width: 1100, height: 620, photo: 1 },
    ],
  },
  {
    slug: 'poster-tunggal',
    name: 'POSTER TUNGGAL',
    desc: '1 foto besar bergaya poster expo wisuda 4R.',
    photoCount: 1,
    previewType: 'single',
    category: 'Single',
    tags: ['single', 'poster', 'wisuda', '1 foto'],
    bgColor: '#131947',
    order: 5,
    showInBooth: true,
    frameImage: '/assets/frames/poster-tunggal.png',
    canvasWidth: 1200,
    canvasHeight: 1800,
    slots: [{ x: 50, y: 260, width: 1100, height: 1200, photo: 0 }],
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

function mergeTemplates(defaults: FrameTemplateItem[], custom: FrameTemplateItem[]): FrameTemplateItem[] {
  const customMap = new Map<string, FrameTemplateItem>();
  custom.forEach((c) => customMap.set(c.slug, c));

  const mergedDefaults = defaults.map((d) => (customMap.has(d.slug) ? customMap.get(d.slug)! : d));
  const newCustoms = custom.filter((c) => !defaults.some((d) => d.slug === c.slug));

  return [...mergedDefaults, ...newCustoms].sort((a, b) => (a.order || 99) - (b.order || 99));
}

// GET: Ambil seluruh template (Default + Kustom / Diperbarui)
export async function GET() {
  const custom = await getCustomFrames();
  const all = mergeTemplates(DEFAULT_TEMPLATES, custom);
  return NextResponse.json({
    success: true,
    data: all,
  });
}

// POST: Tambah Template Frame Baru
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      desc,
      photoCount,
      previewType,
      category,
      tags,
      bgColor,
      order,
      showInBooth,
      frameImageBase64,
      slotRatio,
      slots,
    } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ success: false, error: 'Nama template wajib diisi' }, { status: 400 });
    }

    const count = Number(photoCount) || 4;

    // Validasi Slot JSON jika disertakan
    let validatedSlots: FrameSlotItem[] | undefined = undefined;
    if (slots) {
      const validation = validateTemplateSlots(slots, count, 1200, 1800);
      if (!validation.valid) {
        return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
      }
      validatedSlots = validation.cleanSlots;
    }

    const timestamp = Date.now();
    const slug = `custom-${timestamp}`;
    let finalImageUrl = '/assets/frames/night-city-strip.png';

    // Jika mengunggah gambar baru
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
      desc: desc ? desc.trim() : `${count} foto 4R kustom`,
      photoCount: count,
      previewType: previewType || (category?.toLowerCase() as any) || 'grid',
      category: category || 'Grid',
      tags: Array.isArray(tags) ? tags : typeof tags === 'string' ? tags.split(',').map((t) => t.trim()) : [],
      bgColor: bgColor || '#131947',
      order: Number(order) || 99,
      showInBooth: showInBooth !== false,
      frameImage: finalImageUrl,
      isCustom: true,
      slotRatio: slotRatio || '4:3',
      canvasWidth: 1200,
      canvasHeight: 1800,
      slots: validatedSlots,
    };

    const existing = await getCustomFrames();
    const updated = [...existing, newFrame];
    await saveCustomFrames(updated);

    return NextResponse.json({
      success: true,
      data: newFrame,
      all: mergeTemplates(DEFAULT_TEMPLATES, updated),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// PUT: Perbarui Template yang Sudah Ada (Sesuai Modal Ubah Template)
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const {
      slug,
      name,
      desc,
      photoCount,
      previewType,
      category,
      tags,
      bgColor,
      order,
      showInBooth,
      frameImageBase64,
      slots,
    } = body;

    if (!slug) {
      return NextResponse.json({ success: false, error: 'Slug template tidak ditemukan' }, { status: 400 });
    }
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ success: false, error: 'Nama template wajib diisi' }, { status: 400 });
    }

    const count = Number(photoCount) || 4;

    // Validasi Slot JSON
    let validatedSlots: FrameSlotItem[] | undefined = undefined;
    if (slots) {
      const validation = validateTemplateSlots(slots, count, 1200, 1800);
      if (!validation.valid) {
        return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
      }
      validatedSlots = validation.cleanSlots;
    }

    const existing = await getCustomFrames();
    const existingIndex = existing.findIndex((f) => f.slug === slug);
    const defaultTemplate = DEFAULT_TEMPLATES.find((d) => d.slug === slug);

    let finalImageUrl =
      existingIndex >= 0
        ? existing[existingIndex].frameImage
        : defaultTemplate?.frameImage || '/assets/frames/night-city-strip.png';

    // Jika admin mengunggah file bingkai gambar baru
    if (frameImageBase64 && typeof frameImageBase64 === 'string' && frameImageBase64.includes('base64,')) {
      await fs.mkdir(STORAGE_DIR, { recursive: true });
      const base64Data = frameImageBase64.split(';base64,').pop() || '';
      const filename = `frame-${slug}-${Date.now()}.png`;
      const filepath = path.join(STORAGE_DIR, filename);
      await fs.writeFile(filepath, Buffer.from(base64Data, 'base64'));
      finalImageUrl = `/uploads/frames/${filename}`;
    }

    const updatedItem: FrameTemplateItem = {
      slug,
      name: name.trim().toUpperCase(),
      desc: desc !== undefined ? desc.trim() : (existingIndex >= 0 ? existing[existingIndex].desc : defaultTemplate?.desc || ''),
      photoCount: count,
      previewType: previewType || (category?.toLowerCase() as any) || 'grid',
      category: category || (existingIndex >= 0 ? existing[existingIndex].category : defaultTemplate?.category || 'Grid'),
      tags: Array.isArray(tags) ? tags : typeof tags === 'string' ? tags.split(',').map((t) => t.trim()) : [],
      bgColor: bgColor || '#131947',
      order: Number(order) || 1,
      showInBooth: showInBooth !== false,
      frameImage: finalImageUrl,
      isCustom: true,
      canvasWidth: 1200,
      canvasHeight: 1800,
      slots: validatedSlots || (existingIndex >= 0 ? existing[existingIndex].slots : defaultTemplate?.slots),
    };

    let updatedList: FrameTemplateItem[];
    if (existingIndex >= 0) {
      updatedList = existing.map((f, idx) => (idx === existingIndex ? updatedItem : f));
    } else {
      // Menimpa template default dengan override kustom
      updatedList = [...existing, updatedItem];
    }

    await saveCustomFrames(updatedList);

    return NextResponse.json({
      success: true,
      data: updatedItem,
      all: mergeTemplates(DEFAULT_TEMPLATES, updatedList),
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
      all: mergeTemplates(DEFAULT_TEMPLATES, filtered),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
