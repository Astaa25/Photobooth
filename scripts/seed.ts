import path from 'node:path';
import dotenv from 'dotenv';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../apps/server/src/db/schema.js';
import { DEFAULT_TEMPLATES } from '../apps/server/src/domain/template/default-templates.js';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL tidak ditemukan di .env');
  process.exit(1);
}

const client = postgres(dbUrl, { max: 1 });
const db = drizzle(client, { schema });

async function seed() {
  console.log('\n--- MEMULAI SEED DATA PHOTOBOOTH KE SUPABASE ---\n');

  // 1. Seed Event Utama
  console.log('1. Menyiapkan Event Utama...');
  const [event] = await db
    .insert(schema.events)
    .values({
      name: 'Expo Wisuda Jurusan TIK 2026',
      isActive: true,
      currentQueueNumber: 0,
    })
    .returning();
  console.log(`✓ Event aktif dibuat: ${event.name} (ID: ${event.id})`);

  // 2. Seed Pengaturan Awal (Settings)
  console.log('\n2. Menyiapkan Pengaturan Awal (Settings)...');
  const defaultSettings = [
    { key: 'print_price_per_sheet', value: '15000' },
    { key: 'countdown_seconds', value: '3' },
    { key: 'retention_days', value: '30' },
    { key: 'allow_design_choice', value: 'true' },
    { key: 'gallery_pin_enabled', value: 'false' },
    { key: 'max_sessions_per_ticket', value: '1' },
    { key: 'booth_name', value: 'Photobooth TIK - Booth 1' },
  ];

  for (const s of defaultSettings) {
    await db.insert(schema.settings).values(s).onConflictDoUpdate({
      target: schema.settings.key,
      set: { value: s.value, updatedAt: new Date() },
    });
  }
  console.log(`✓ ${defaultSettings.length} konfigurasi awal disimpan.`);

  // 3. Seed 5 Template Bawaan & Versi Immutable
  console.log('\n3. Menyiapkan 5 Template 4R Bawaan...');
  for (const tpl of DEFAULT_TEMPLATES) {
    const [insertedTpl] = await db
      .insert(schema.templates)
      .values({
        slug: tpl.slug,
        name: tpl.name,
        description: tpl.description,
        category: tpl.category,
        isActive: true,
      })
      .onConflictDoUpdate({
        target: schema.templates.slug,
        set: { name: tpl.name, description: tpl.description },
      })
      .returning();

    // Buat template version 1
    await db.insert(schema.templateVersions).values({
      templateId: insertedTpl.id,
      versionNumber: 1,
      config: tpl,
    });
    console.log(`✓ Template ${tpl.name} [v1] tersimpan.`);
  }

  console.log('\n✅ SEEDING SELESAI DENGAN SUKSES!\n');
  await client.end();
}

seed().catch((err) => {
  console.error('Gagal menjalankan seed:', err);
  process.exit(1);
});
