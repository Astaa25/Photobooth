import { Readable } from 'node:stream';
import sharp from 'sharp';
import type { CameraDriver, CaptureResult } from './camera.interface.js';

export class MockCameraDriver implements CameraDriver {
  public readonly name = 'mock';
  private connected = true;
  private captureCount = 0;

  constructor(options?: { initiallyConnected?: boolean }) {
    if (options?.initiallyConnected !== undefined) {
      this.connected = options.initiallyConnected;
    }
  }

  public setConnected(status: boolean): void {
    this.connected = status;
  }

  public async isConnected(): Promise<boolean> {
    return this.connected;
  }

  public async capture(timeoutMs = 15000): Promise<CaptureResult> {
    if (!this.connected) {
      throw new Error('Kamera Canon tidak terdeteksi atau terputus.');
    }

    this.captureCount++;
    const currentNumber = this.captureCount;

    // Mensimulasikan jeda shutter fisik kamera (sekitar 600ms)
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Menghasilkan JPEG valid dengan sharp (1920 x 1280)
    const width = 1920;
    const height = 1280;

    // SVG grafis simulasi foto studio
    const svgOverlay = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#1a202c" />
        <circle cx="${width / 2}" cy="${height / 2 - 80}" r="260" fill="#2d3748" />
        <circle cx="${width / 2}" cy="${height / 2 - 120}" r="120" fill="#e2e8f0" />
        <ellipse cx="${width / 2}" cy="${height / 2 + 160}" rx="220" ry="140" fill="#4a5568" />
        <text x="50" y="100" font-family="sans-serif" font-size="48" fill="#FFD84D" font-weight="bold">MOCK CANON EOS - CAPTURE #${currentNumber}</text>
        <text x="50" y="160" font-family="sans-serif" font-size="28" fill="#E4E6EA">${new Date().toISOString()}</text>
        <rect x="40" y="40" width="${width - 80}" height="${height - 80}" fill="none" stroke="#2438D9" stroke-width="4" stroke-dasharray="16,16" />
      </svg>
    `;

    const buffer = await sharp(Buffer.from(svgOverlay))
      .jpeg({ quality: 92 })
      .toBuffer();

    return {
      filePath: `mock_capture_${Date.now()}_${currentNumber}.jpg`,
      buffer,
      mimeType: 'image/jpeg',
      width,
      height,
    };
  }

  public async startLiveView(): Promise<Readable | null> {
    if (!this.connected) return null;
    // Mengembalikan stream dummy
    return Readable.from([]);
  }

  public async stopLiveView(): Promise<void> {
    // Selesai
  }
}
