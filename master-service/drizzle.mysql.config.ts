import type { Config } from 'drizzle-kit';
import dotenv from 'dotenv';
dotenv.config();

export default {
  schema: './src/schemas/mysql.schema.ts',
  out: './src/database/migrations/mysql',
  driver: 'mysql2',
  dbCredentials: {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    database: process.env.MYSQL_DB || 'ump_master',
    user: process.env.MYSQL_USER || 'ump_user',
    password: process.env.MYSQL_PASSWORD || '',
  },
  verbose: true,
  strict: true,
} satisfies Config;
