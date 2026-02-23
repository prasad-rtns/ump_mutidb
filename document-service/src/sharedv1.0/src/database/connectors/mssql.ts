import { DatabaseType } from "../../types";

export async function connectMSSQL(config: { type?: DatabaseType; connectionString: any; }) {
  const sql = await import("mssql");

  const pool = await sql.connect(config.connectionString);

  return pool;
}