export interface DbConfig {
  connectionString: string;
}

export async function connect(config: DbConfig) {
  const { Pool } = await import('pg');
  const { drizzle } = await import('drizzle-orm/node-postgres');

  const pool = new Pool({ connectionString: config.connectionString });

  return drizzle(pool);
}