import type { Config } from 'drizzle-kit';
import dotenv from 'dotenv';
dotenv.config();

export default {
  schema: './src/schemas/pg.schema.ts',
  out: './src/database/migrations/pg',
  driver: 'pg',
  dbCredentials: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    database: process.env.POSTGRES_DB || 'ump_auth',
    user: process.env.POSTGRES_USER || 'ump_user',
    password: process.env.POSTGRES_PASSWORD || '',
  },
  verbose: true,
  strict: true,
} satisfies Config;
