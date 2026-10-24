import { Readable } from 'node:stream';

export interface CaptureResult {
  filePath: string;
  buffer: Buffer;
  mimeType: 'image/jpeg';
  width: number;
  height: number;
}

export interface CameraDriver {
  name: string;
  isConnected(): Promise<boolean>;
  capture(timeoutMs?: number): Promise<CaptureResult>;
  startLiveView(): Promise<Readable | null>;
  stopLiveView(): Promise<void>;
}
