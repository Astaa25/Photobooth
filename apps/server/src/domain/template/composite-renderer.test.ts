import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import { CompositeRenderer } from './composite-renderer.js';
import { DEFAULT_TEMPLATES } from './default-templates.js';

describe('CompositeRenderer', () => {
  const renderer = new CompositeRenderer();

  // Helper untuk membuat buffer gambar simulasi warna polos
  async function createTestPhoto(color: string): Promise<Buffer> {
    return sharp({
      create: {
        width: 1600,
        height: 1200,
        channels: 3,
        background: color,
      },
    })
      .jpeg()
      .toBuffer();
  }

  it('merender template 4-foto strip ganda (8 slot) menghasilkan komposit 1200x1800 tanpa EXIF', async () => {
    const stripTemplate = DEFAULT_TEMPLATES.find((t) => t.slug === 'night-city-strip')!;
    expect(stripTemplate).toBeDefined();

    // Sediakan 4 foto sumber
    const photos = await Promise.all([
      createTestPhoto('#ff5555'),
      createTestPhoto('#55ff55'),
      createTestPhoto('#5555ff'),
      createTestPhoto('#ffff55'),
    ]);

    const rendered = await renderer.render({
      template: stripTemplate,
      photoBuffers: photos,
    });

    expect(rendered).toBeInstanceOf(Buffer);
    expect(rendered.length).toBeGreaterThan(0);

    const meta = await sharp(rendered).metadata();
    expect(meta.format).toBe('jpeg');
    expect(meta.width).toBe(1200);
    expect(meta.height).toBe(1800);
    // Pastikan EXIF tidak bocor
    expect(meta.exif).toBeUndefined();
  });

  it('merender template 2x2 grid (4 slot) menghasilkan komposit 1200x1800 yang valid', async () => {
    const gridTemplate = DEFAULT_TEMPLATES.find((t) => t.slug === 'night-city-grid')!;
    const photos = await Promise.all([
      createTestPhoto('#111111'),
      createTestPhoto('#222222'),
      createTestPhoto('#333333'),
      createTestPhoto('#444444'),
    ]);

    const rendered = await renderer.render({
      template: gridTemplate,
      photoBuffers: photos,
    });

    const meta = await sharp(rendered).metadata();
    expect(meta.width).toBe(1200);
    expect(meta.height).toBe(1800);
  });

  it('menghasilkan thumbnail WebP dengan ukuran lebih kecil', async () => {
    const photo = await createTestPhoto('#336699');
    const thumb = await renderer.createThumbnail(photo, 400);

    const meta = await sharp(thumb).metadata();
    expect(meta.format).toBe('webp');
    expect(meta.width).toBe(400);
  });
});
