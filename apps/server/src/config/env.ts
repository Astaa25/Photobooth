import path from 'node:path';
import dotenv from 'dotenv';
import { z } from 'zod';

// Muat .env dari root monorepo atau direktori kerja saat ini
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config(); // Fallback ke direktori saat ini

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  TZ: z.string().default('Asia/Jakarta'),

  // Database
  DATABASE_URL: z.string().url('DATABASE_URL harus berupa URL PostgreSQL yang valid').default('postgres://booth_app:change_me@localhost:5432/booth'),
  DATABASE_MIGRATOR_URL: z.string().url().optional(),

  // Server
  API_HOST: z.string().default('0.0.0.0'),
  API_PORT: z.coerce.number().int().positive().default(4000),
  WEB_ORIGIN: z.string().default('http://localhost:3000'),
  PUBLIC_BASE_URL: z.string().default('http://localhost:3000'),
  PUBLIC_MODE: z.enum(['tunnel', 'lan-http']).default('lan-http'),
  ADMIN_ALLOWED_CIDRS: z.string().default('127.0.0.1/32,192.168.0.0/16,10.0.0.0/8'),

  // Rahasia
  SESSION_SECRET: z.string().min(16, 'SESSION_SECRET harus memiliki panjang minimal 16 karakter (disarankan 32+)').default('dev-session-secret-change-in-production-min-32-bytes'),
  ENCRYPTION_KEY: z.string().min(16, 'ENCRYPTION_KEY harus disetel').default('dev-encryption-key-32-bytes-base64=='),
  HMAC_PEPPER: z.string().min(16, 'HMAC_PEPPER harus disetel').default('dev-hmac-pepper-min-16-chars'),
  GALLERY_TOKEN_BYTES: z.coerce.number().int().default(32),

  // Penyimpanan
  STORAGE_ROOT: z.string().default(path.resolve(process.cwd(), 'storage/booth-storage')),
  BACKUP_ROOT: z.string().default(path.resolve(process.cwd(), 'storage/booth-backup')),

  // Kamera & Driver
  CAMERA_DRIVER: z.enum(['mock', 'digicamcontrol', 'gphoto2']).default('mock'),
  DIGICAM_BASE_URL: z.string().default('http://127.0.0.1:5513'),
  CAPTURE_TIMEOUT_MS: z.coerce.number().int().default(15000),
  LIVEVIEW_ENABLED: z.coerce.boolean().default(true),

  // Printer & Driver
  PRINTER_DRIVER: z.enum(['mock', 'sumatra', 'cups']).default('mock'),
  PRINTER_NAME: z.string().optional(),
  SUMATRA_PATH: z.string().optional(),
  PRINT_PAPER: z.string().default('4R'),

  // Media
  FFMPEG_PATH: z.string().default('ffmpeg'),

  // Galeri
  GALLERY_MODE: z.enum(['local', 'cloud']).default('local'),
});

export type Env = z.infer<typeof EnvSchema>;

let parsedEnv: Env;
try {
  parsedEnv = EnvSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('\n❌ KESALAHAN VALIDASI .ENV:');
    for (const issue of error.issues) {
      console.error(` - [${issue.path.join('.')}]: ${issue.message}`);
    }
    console.error('\nSilakan periksa file .env Anda sesuai spesifikasi TECHSTACK.md\n');
  } else {
    console.error('Kesalahan tak terduga saat memvalidasi variabel lingkungan:', error);
  }
  process.exit(1);
}

export const env = parsedEnv;
