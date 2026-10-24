import { pgTable, uuid, text, integer, timestamp, boolean, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// 1. Events
export const events = pgTable('events', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  currentQueueNumber: integer('current_queue_number').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 2. Visitors
export const visitors = pgTable(
  'visitors',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    eventId: uuid('event_id')
      .references(() => events.id)
      .notNull(),
    nickname: text('nickname').notNull(),
    phoneEncrypted: text('phone_encrypted'), // AES-256-GCM
    phoneHmac: text('phone_hmac'), // HMAC-SHA256 untuk indexing/pencocokan
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_visitors_phone_hmac').on(table.phoneHmac),
  ]
);

// 3. Queue Tickets
export const queueTickets = pgTable(
  'queue_tickets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    eventId: uuid('event_id')
      .references(() => events.id)
      .notNull(),
    visitorId: uuid('visitor_id')
      .references(() => visitors.id)
      .notNull(),
    number: integer('number').notNull(),
    status: text('status', {
      enum: ['queued', 'waiting', 'in_session', 'done', 'cancelled'],
    })
      .default('queued')
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('idx_queue_event_number').on(table.eventId, table.number),
  ]
);

// 4. Photo Sessions
export const photoSessions = pgTable(
  'photo_sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    boothId: text('booth_id').default('booth_1').notNull(),
    queueTicketId: uuid('queue_ticket_id')
      .references(() => queueTickets.id)
      .notNull(),
    templateVersionId: uuid('template_version_id'),
    status: text('status', {
      enum: ['created', 'choosing_design', 'capturing', 'reviewing', 'processing', 'completed', 'failed', 'aborted'],
    })
      .default('created')
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // PRD F2: Hanya satu sesi aktif per booth yang diizinkan database
    uniqueIndex('idx_one_active_session_per_booth')
      .on(table.boothId)
      .where(sql`status IN ('created', 'choosing_design', 'capturing', 'reviewing', 'processing')`),
  ]
);

// 5. Captures (Versi foto mentah)
export const captures = pgTable('captures', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id')
    .references(() => photoSessions.id)
    .notNull(),
  sourceIndex: integer('source_index').notNull(),
  version: integer('version').default(1).notNull(),
  filePath: text('file_path').notNull(),
  status: text('status', { enum: ['received', 'accepted', 'superseded', 'failed'] })
    .default('received')
    .notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 6. Outputs (Individual, Strip komposit, Video, Thumbnail)
export const outputs = pgTable('outputs', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id')
    .references(() => photoSessions.id)
    .notNull(),
  kind: text('kind', { enum: ['individual', 'strip', 'video', 'thumbnail'] }).notNull(),
  filePath: text('file_path').notNull(),
  width: integer('width'),
  height: integer('height'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 7. Galleries (Akses publik via token ter-hash)
export const galleries = pgTable(
  'galleries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    visitorId: uuid('visitor_id')
      .references(() => visitors.id)
      .notNull(),
    tokenHash: text('token_hash').notNull().unique(), // SHA-256 dari token acak 256-bit
    pinHash: text('pin_hash'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    isRevoked: boolean('is_revoked').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_galleries_token_hash').on(table.tokenHash),
  ]
);

// 8. Templates & Versions
export const templates = pgTable('templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description').default('').notNull(),
  category: text('category').default('strip').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const templateVersions = pgTable('template_versions', {
  id: uuid('id').defaultRandom().primaryKey(),
  templateId: uuid('template_id')
    .references(() => templates.id)
    .notNull(),
  versionNumber: integer('version_number').notNull(),
  config: jsonb('config').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 9. Print Orders & Payments (Uang disimpan bulat rupiah)
export const printOrders = pgTable('print_orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id')
    .references(() => photoSessions.id)
    .notNull(),
  visitorId: uuid('visitor_id')
    .references(() => visitors.id)
    .notNull(),
  totalAmount: integer('total_amount').notNull(), // Rupiah bulat
  paymentStatus: text('payment_status', { enum: ['unpaid', 'pending_confirmation', 'paid', 'void'] })
    .default('unpaid')
    .notNull(),
  printStatus: text('print_status', { enum: ['not_printed', 'queued', 'printing', 'succeeded', 'failed'] })
    .default('not_printed')
    .notNull(),
  idempotencyKey: text('idempotency_key').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const printOrderItems = pgTable('print_order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id')
    .references(() => printOrders.id)
    .notNull(),
  outputId: uuid('output_id')
    .references(() => outputs.id)
    .notNull(),
  unitPrice: integer('unit_price').notNull(), // Salinan harga saat pesanan dibuat
  quantity: integer('quantity').default(1).notNull(),
});

export const payments = pgTable('payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id')
    .references(() => printOrders.id)
    .notNull(),
  method: text('method', { enum: ['cash', 'qris_static', 'transfer'] }).notNull(),
  amount: integer('amount').notNull(),
  status: text('status', { enum: ['completed', 'void'] }).default('completed').notNull(),
  recordedBy: text('recorded_by').default('operator').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 10. Audit Log (Append-Only)
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  action: text('action').notNull(),
  actorRole: text('actor_role').notNull(),
  actorId: text('actor_id'),
  details: jsonb('details'),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 11. Settings
export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
