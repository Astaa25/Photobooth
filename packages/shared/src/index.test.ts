import { describe, it, expect } from 'vitest';
import {
  QueueStatus,
  SessionStatus,
  isValidQueueTransition,
  isValidSessionTransition,
  VisitorRegistrationSchema,
  calculateRequiredPhotosCount,
} from './index.js';

describe('Shared State Machines & Validation', () => {
  it('hanya mengizinkan transisi antrean yang sah sesuai PRD F2', () => {
    // Sah
    expect(isValidQueueTransition(QueueStatus.QUEUED, QueueStatus.IN_SESSION)).toBe(true);
    expect(isValidQueueTransition(QueueStatus.QUEUED, QueueStatus.WAITING)).toBe(true);
    expect(isValidQueueTransition(QueueStatus.WAITING, QueueStatus.IN_SESSION)).toBe(true);
    expect(isValidQueueTransition(QueueStatus.IN_SESSION, QueueStatus.DONE)).toBe(true);
    expect(isValidQueueTransition(QueueStatus.QUEUED, QueueStatus.CANCELLED)).toBe(true);

    // Tidak sah (harus ditolak)
    expect(isValidQueueTransition(QueueStatus.QUEUED, QueueStatus.DONE)).toBe(false);
    expect(isValidQueueTransition(QueueStatus.DONE, QueueStatus.QUEUED)).toBe(false);
    expect(isValidQueueTransition(QueueStatus.CANCELLED, QueueStatus.IN_SESSION)).toBe(false);
  });

  it('hanya mengizinkan transisi sesi yang sah sesuai PRD F3', () => {
    expect(isValidSessionTransition(SessionStatus.CREATED, SessionStatus.CHOOSING_DESIGN)).toBe(true);
    expect(isValidSessionTransition(SessionStatus.CHOOSING_DESIGN, SessionStatus.CAPTURING)).toBe(true);
    expect(isValidSessionTransition(SessionStatus.CAPTURING, SessionStatus.REVIEWING)).toBe(true);
    expect(isValidSessionTransition(SessionStatus.REVIEWING, SessionStatus.PROCESSING)).toBe(true);
    expect(isValidSessionTransition(SessionStatus.PROCESSING, SessionStatus.COMPLETED)).toBe(true);

    // Langsung selesai tanpa review/processing harus ditolak
    expect(isValidSessionTransition(SessionStatus.CREATED, SessionStatus.COMPLETED)).toBe(false);
  });

  it('memvalidasi pendaftaran pengunjung dan menolak bot honeypot', () => {
    // Valid
    const valid = VisitorRegistrationSchema.safeParse({
      nickname: 'Diana',
      phone: '081234567890',
    });
    expect(valid.success).toBe(true);

    // Nama kosong ditolak
    const emptyName = VisitorRegistrationSchema.safeParse({
      nickname: '',
    });
    expect(emptyName.success).toBe(false);

    // Honeypot terisi (indikasi spam bot) harus ditolak
    const bot = VisitorRegistrationSchema.safeParse({
      nickname: 'SpamBot',
      website_trap: 'http://spam.com',
    });
    expect(bot.success).toBe(false);
  });

  it('menghitung jumlah foto yang dibutuhkan dari template slots secara akurat', () => {
    // Contoh 8 slot strip ganda dengan 4 foto sumber (0, 1, 2, 3)
    const slots = [
      { x: 0, y: 0, width: 500, height: 300, source_index: 0, crop_mode: 'cover' as const, layer: 'under' as const, rotation: 0 },
      { x: 600, y: 0, width: 500, height: 300, source_index: 0, crop_mode: 'cover' as const, layer: 'under' as const, rotation: 0 },
      { x: 0, y: 350, width: 500, height: 300, source_index: 1, crop_mode: 'cover' as const, layer: 'under' as const, rotation: 0 },
      { x: 600, y: 350, width: 500, height: 300, source_index: 1, crop_mode: 'cover' as const, layer: 'under' as const, rotation: 0 },
    ];
    expect(calculateRequiredPhotosCount(slots)).toBe(2);
  });
});
