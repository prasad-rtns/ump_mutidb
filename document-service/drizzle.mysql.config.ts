import type { Config } from 'drizzle-kit';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, './.env') });

export default {
  dialect: 'mysql',
  schema: './src/schemas/mysql.schema.ts',
  out: './src/database/migrations/mysql',
  dbCredentials: {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    database: process.env.MYSQL_DB || 'ump_documents',
    user: process.env.MYSQL_USER || 'ump_user',
    password: process.env.MYSQL_PASSWORD || '',
  },
  verbose: true,
  strict: true,
} satisfies Config;
