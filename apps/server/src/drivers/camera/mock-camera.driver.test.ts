import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import { MockCameraDriver } from './mock-camera.driver.js';

describe('MockCameraDriver', () => {
  it('berhasil mengambil foto dan mengembalikan buffer JPEG yang valid', async () => {
    const driver = new MockCameraDriver();
    const isConnected = await driver.isConnected();
    expect(isConnected).toBe(true);

    const result = await driver.capture();
    expect(result.mimeType).toBe('image/jpeg');
    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.buffer.length).toBeGreaterThan(0);

    // Verifikasi dengan sharp bahwa gambar adalah JPEG valid dan terbaca
    const metadata = await sharp(result.buffer).metadata();
    expect(metadata.format).toBe('jpeg');
    expect(metadata.width).toBe(1920);
    expect(metadata.height).toBe(1280);
  });

  it('gagal mengambil foto jika status kamera terputus', async () => {
    const driver = new MockCameraDriver({ initiallyConnected: false });
    await expect(driver.capture()).rejects.toThrow('Kamera Canon tidak terdeteksi atau terputus.');
  });
});
