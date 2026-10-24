import path from 'node:path';
import fs from 'node:fs';
import sharp from 'sharp';
import type { TemplateConfig, TemplateSlot } from '@photobooth/shared';

export interface RenderCompositeOptions {
  template: TemplateConfig;
  photoBuffers: Buffer[]; // Array buffer foto sumber yang urutannya sesuai source_index
  framesBasePath?: string;
}

export class CompositeRenderer {
  /**
   * Merender komposit photo strip 4R (1200 x 1800) secara deterministik dan idempoten.
   */
  public async render(options: RenderCompositeOptions): Promise<Buffer> {
    const { template, photoBuffers } = options;
    const width = template.canvas_width || 1200;
    const height = template.canvas_height || 1800;

    // 1. Kanvas dasar dengan warna latar template
    const baseCanvas = sharp({
      create: {
        width,
        height,
        channels: 4,
        background: template.bg_color || '#131947',
      },
    });

    const composites: sharp.OverlayOptions[] = [];

    // 2. Potong dan tempatkan setiap slot foto (cover mode)
    for (const slot of template.slots) {
      const sourcePhotoBuffer = photoBuffers[slot.source_index];
      if (!sourcePhotoBuffer) continue;

      // Crop (cover) sesuai rasio dan dimensi slot tepat
      const processedSlot = await sharp(sourcePhotoBuffer)
        .rotate() // Menghormati orientasi EXIF awal jika ada sebelum dibuang
        .resize({
          width: Math.round(slot.width),
          height: Math.round(slot.height),
          fit: slot.crop_mode === 'contain' ? 'contain' : 'cover',
          position: 'center',
        })
        .toBuffer();

      composites.push({
        input: processedSlot,
        left: Math.round(slot.x),
        top: Math.round(slot.y),
      });
    }

    // 3. Tambahkan bingkai overlay PNG transparan jika ada
    if (template.frame_asset) {
      const framePath = options.framesBasePath
        ? path.resolve(options.framesBasePath, template.frame_asset)
        : path.resolve(process.cwd(), 'apps/server/src/assets/templates', template.frame_asset);

      if (fs.existsSync(framePath)) {
        const frameBuffer = await sharp(framePath)
          .resize(width, height)
          .toBuffer();

        composites.push({
          input: frameBuffer,
          left: 0,
          top: 0,
        });
      }
    }

    // 4. Render komposit final, buang semua EXIF & GPS (SECURITY.md A3 & TECHSTACK.md)
    return baseCanvas
      .composite(composites)
      .jpeg({ quality: 92, mozjpeg: true })
      .toBuffer();
  }

  /**
   * Menghasilkan WebP thumbnail dan placeholder blur kecil
   */
  public async createThumbnail(imageBuffer: Buffer, width = 400): Promise<Buffer> {
    return sharp(imageBuffer)
      .resize({ width, fit: 'inside' })
      .webp({ quality: 80 })
      .toBuffer();
  }
}
