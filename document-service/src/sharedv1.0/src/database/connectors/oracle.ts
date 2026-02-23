import { DatabaseType } from '../../types';

export async function connect(config: { type?: DatabaseType; connectionString: any; user?: any; password?: any; }) {
  const oracledb = await import('oracledb');

  const connection = await oracledb.getConnection({
    connectionString: config.connectionString,
    user: config.user,
    password: config.password
  });

  return connection;
}