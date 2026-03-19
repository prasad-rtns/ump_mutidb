import type { Config } from 'drizzle-kit';
import dotenv from 'dotenv';
dotenv.config();

const host = process.env.DRIZZLE_POSTGRES_HOST || process.env.POSTGRES_HOST || 'localhost';
const port = parseInt(process.env.DRIZZLE_POSTGRES_PORT || process.env.POSTGRES_PORT || '5432', 10);
const database = process.env.DRIZZLE_POSTGRES_DB || process.env.POSTGRES_DB || 'ump_documents';
const user = process.env.DRIZZLE_POSTGRES_USER || process.env.POSTGRES_USER || 'ump_user';
const password = process.env.DRIZZLE_POSTGRES_PASSWORD || process.env.POSTGRES_PASSWORD || '';
const sslEnabled = (process.env.DRIZZLE_POSTGRES_SSL || process.env.POSTGRES_SSL) === 'true';

export default {
  schema: './src/schemas/pg.schema.ts',
  out: './src/database/migrations/pg',
  dialect: 'postgresql',
  dbCredentials: {
    host,
    port,
    database,
    user,
    password,
    ssl: sslEnabled ? { rejectUnauthorized: false } : false,
  },
  verbose: true,
  strict: true,
} satisfies Config;
