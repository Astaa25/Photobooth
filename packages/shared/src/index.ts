import { z } from 'zod';

// ==========================================
// 1. STATUS KONSTANTA & ENUM (PRD.md F2 & F3)
// ==========================================

export const QueueStatus = {
  QUEUED: 'queued',
  WAITING: 'waiting',
  IN_SESSION: 'in_session',
  DONE: 'done',
  CANCELLED: 'cancelled',
} as const;
export type QueueStatusType = (typeof QueueStatus)[keyof typeof QueueStatus];
export const QueueStatusSchema = z.nativeEnum(QueueStatus);

export const SessionStatus = {
  CREATED: 'created',
  CHOOSING_DESIGN: 'choosing_design',
  CAPTURING: 'capturing',
  REVIEWING: 'reviewing',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  ABORTED: 'aborted',
} as const;
export type SessionStatusType = (typeof SessionStatus)[keyof typeof SessionStatus];
export const SessionStatusSchema = z.nativeEnum(SessionStatus);

export const PaymentStatus = {
  UNPAID: 'unpaid',
  PENDING_CONFIRMATION: 'pending_confirmation',
  PAID: 'paid',
  VOID: 'void',
} as const;
export type PaymentStatusType = (typeof PaymentStatus)[keyof typeof PaymentStatus];
export const PaymentStatusSchema = z.nativeEnum(PaymentStatus);

export const PrintStatus = {
  NOT_PRINTED: 'not_printed',
  QUEUED: 'queued',
  PRINTING: 'printing',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
} as const;
export type PrintStatusType = (typeof PrintStatus)[keyof typeof PrintStatus];
export const PrintStatusSchema = z.nativeEnum(PrintStatus);

export const OutputKind = {
  INDIVIDUAL: 'individual',
  STRIP: 'strip',
  VIDEO: 'video',
  THUMBNAIL: 'thumbnail',
} as const;
export type OutputKindType = (typeof OutputKind)[keyof typeof OutputKind];
export const OutputKindSchema = z.nativeEnum(OutputKind);

// ==========================================
// 2. STATE MACHINES (PRD.md F2 & F3, Task.md T3)
// ==========================================

const VALID_QUEUE_TRANSITIONS: Record<QueueStatusType, readonly QueueStatusType[]> = {
  [QueueStatus.QUEUED]: [QueueStatus.IN_SESSION, QueueStatus.WAITING, QueueStatus.CANCELLED],
  [QueueStatus.WAITING]: [QueueStatus.IN_SESSION, QueueStatus.QUEUED, QueueStatus.CANCELLED],
  [QueueStatus.IN_SESSION]: [QueueStatus.DONE, QueueStatus.CANCELLED],
  [QueueStatus.DONE]: [],
  [QueueStatus.CANCELLED]: [],
};

export function isValidQueueTransition(from: QueueStatusType, to: QueueStatusType): boolean {
  const allowed = VALID_QUEUE_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

const VALID_SESSION_TRANSITIONS: Record<SessionStatusType, readonly SessionStatusType[]> = {
  [SessionStatus.CREATED]: [SessionStatus.CHOOSING_DESIGN, SessionStatus.ABORTED],
  [SessionStatus.CHOOSING_DESIGN]: [SessionStatus.CAPTURING, SessionStatus.ABORTED],
  [SessionStatus.CAPTURING]: [SessionStatus.REVIEWING, SessionStatus.FAILED, SessionStatus.ABORTED],
  [SessionStatus.REVIEWING]: [SessionStatus.CAPTURING, SessionStatus.PROCESSING, SessionStatus.ABORTED],
  [SessionStatus.PROCESSING]: [SessionStatus.COMPLETED, SessionStatus.FAILED],
  [SessionStatus.COMPLETED]: [],
  [SessionStatus.FAILED]: [SessionStatus.PROCESSING, SessionStatus.ABORTED],
  [SessionStatus.ABORTED]: [],
};

export function isValidSessionTransition(from: SessionStatusType, to: SessionStatusType): boolean {
  const allowed = VALID_SESSION_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

// ==========================================
// 3. REGISTRASI PENGUNJUNG (PRD.md F1, SECURITY.md A4 & A5)
// ==========================================

export const VisitorRegistrationSchema = z.object({
  nickname: z
    .string()
    .trim()
    .min(1, 'Nama panggilan wajib diisi')
    .max(40, 'Nama panggilan maksimal 40 karakter')
    .regex(/^[\p{L}\p{N}\s._-]+$/u, 'Nama hanya boleh memuat huruf, angka, spasi, atau karakter . _ -'),
  phone: z
    .string()
    .trim()
    .regex(/^(\+62|62|0)8[1-9][0-9]{6,11}$/, 'Format nomor telepon Indonesia tidak valid')
    .optional()
    .or(z.literal('')),
  // Honeypot field (wajib kosong untuk mencegah bot pendaftaran)
  website_trap: z.string().max(0, 'Bot terdeteksi').optional(),
});
export type VisitorRegistrationInput = z.infer<typeof VisitorRegistrationSchema>;

// ==========================================
// 4. TEMPLATE & SLOT SCHEMA (PRD.md F4)
// ==========================================

export const TemplateSlotSchema = z.object({
  x: z.number().min(0),
  y: z.number().min(0),
  width: z.number().positive(),
  height: z.number().positive(),
  source_index: z.number().int().min(0),
  crop_mode: z.enum(['cover', 'contain']).default('cover'),
  layer: z.enum(['under', 'over']).default('under'),
  rotation: z.number().int().default(0),
});
export type TemplateSlot = z.infer<typeof TemplateSlotSchema>;

export const TemplateConfigSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string().default(''),
  category: z.string().default('strip'),
  tags: z.array(z.string()).default([]),
  canvas_width: z.number().int().default(1200),
  canvas_height: z.number().int().default(1800),
  bg_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Format warna harus heksadesimal #RRGGBB').default('#131947'),
  slots: z.array(TemplateSlotSchema).min(1),
  frame_asset: z.string().optional(),
});
export type TemplateConfig = z.infer<typeof TemplateConfigSchema>;

// Menghitung jumlah foto unik yang dibutuhkan dari source_index slot
export function calculateRequiredPhotosCount(slots: TemplateSlot[]): number {
  const uniqueIndices = new Set(slots.map((s) => s.source_index));
  return uniqueIndices.size;
}

// ==========================================
// 5. WEBSOCKET AMPLID & PROTOKOL (TECHSTACK.md)
// ==========================================

export const WebSocketEnvelopeSchema = z.object({
  type: z.string(),
  id: z.string().uuid(),
  ts: z.string().datetime(),
  payload: z.record(z.unknown()),
});
export type WebSocketEnvelope = z.infer<typeof WebSocketEnvelopeSchema>;

// ==========================================
// 6. PESANAN CETAK (PRD.md F7)
// ==========================================

export const CreatePrintOrderSchema = z.object({
  session_id: z.string().uuid(),
  items: z
    .array(
      z.object({
        output_id: z.string().uuid(),
        quantity: z.number().int().min(1).max(20),
      })
    )
    .min(1, 'Pilih minimal satu foto untuk dicetak'),
  idempotency_key: z.string().min(16),
});
export type CreatePrintOrderInput = z.infer<typeof CreatePrintOrderSchema>;
