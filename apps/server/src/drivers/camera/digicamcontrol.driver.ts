import { Readable } from 'node:stream';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import type { CameraDriver, CaptureResult } from './camera.interface.js';

export interface DigiCamControlOptions {
  baseUrl?: string; // Default http://127.0.0.1:5513
  captureFolder?: string;
}

export class DigiCamControlDriver implements CameraDriver {
  public readonly name = 'digicamcontrol';
  private baseUrl: string;
  private captureFolder: string;

  constructor(options?: DigiCamControlOptions) {
    this.baseUrl = options?.baseUrl || 'http://127.0.0.1:5513';
    this.captureFolder = options?.captureFolder || path.resolve(process.cwd(), 'storage/captures');

    if (!fs.existsSync(this.captureFolder)) {
      fs.mkdirSync(this.captureFolder, { recursive: true });
    }
  }

  public async isConnected(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${this.baseUrl}/?CMD=All_Camera_List`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) return false;
      const text = await res.text();
      return text.trim().length > 0 && !text.includes('No camera');
    } catch {
      return false;
    }
  }

  public async capture(timeoutMs = 15000): Promise<CaptureResult> {
    const isOnline = await this.isConnected();
    if (!isOnline) {
      throw new Error('Kamera Canon / digiCamControl tidak terhubung atau server digiCamControl belum dibuka.');
    }

    // Catat waktu mulai untuk melacak file baru yang muncul
    const startTime = Date.now();

    // Kirim perintah Capture ke digiCamControl
    const res = await fetch(`${this.baseUrl}/?CMD=Capture`);
    if (!res.ok) {
      throw new Error(`Gagal mengirim perintah Capture ke digiCamControl: ${res.statusText}`);
    }

    // Polling folder tangkapan untuk file gambar terbaru dalam batas timeout
    const deadline = startTime + timeoutMs;
    let foundFile: string | null = null;

    while (Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const files = fs.readdirSync(this.captureFolder);
      for (const file of files) {
        if (!file.match(/\.(jpg|jpeg)$/i)) continue;
        const fullPath = path.join(this.captureFolder, file);
        const stat = fs.statSync(fullPath);
        if (stat.mtimeMs >= startTime) {
          foundFile = fullPath;
          break;
        }
      }
      if (foundFile) break;
    }

    if (!foundFile) {
      throw new Error(`Batas waktu pengambilan foto (${timeoutMs / 1000}s) habis: file tidak diterima dari kamera.`);
    }

    const buffer = fs.readFileSync(foundFile);
    if (buffer.length === 0) {
      throw new Error('File foto yang diterima kosong.');
    }

    // Validasi integritas gambar dengan Sharp
    const metadata = await sharp(buffer).metadata();
    if (!metadata.width || !metadata.height || metadata.format !== 'jpeg') {
      throw new Error('File hasil kamera bukan format JPEG yang valid.');
    }

    return {
      filePath: foundFile,
      buffer,
      mimeType: 'image/jpeg',
      width: metadata.width,
      height: metadata.height,
    };
  }

  public async startLiveView(): Promise<Readable | null> {
    try {
      await fetch(`${this.baseUrl}/?CMD=LiveView_Start`);
      return null;
    } catch {
      return null;
    }
  }

  public async stopLiveView(): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/?CMD=LiveView_Stop`);
    } catch {
      // Diamkan
    }
  }
}
