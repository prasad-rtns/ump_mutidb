import { DatabaseType } from '../types/index.js';
// @ts-ignore
export async function createDatabase(config: {
  type: DatabaseType;
  connectionString: string;
}) {
  switch (config.type) {
    case 'postgres':
      return (await import('./connectors/postgres.js')).connect(config);

    case 'mysql':
      return (await import('./connectors/mysql.js')).connect(config);

    case 'mssql':
      return (await import('./connectors/mssql.js')).connectMSSQL(config);

    case 'mongodb':
      return (await import('./connectors/mongodb.js')).connect(config);

    case 'oracle':
      return (await import('./connectors/oracle.js')).connect(config);

    default:
      throw new Error('Unsupported database');
  }
}