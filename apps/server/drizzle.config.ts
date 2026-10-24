import path from 'node:path';
import dotenv from 'dotenv';
import { defineConfig } from 'drizzle-kit';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config();

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || '',
  },
});
