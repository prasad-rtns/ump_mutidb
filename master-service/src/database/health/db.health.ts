import { getDbPools } from '../adapters/db.connection';

export async function checkDbHealth() {
  const pools = getDbPools();
  const results: Record<string, any> = {};

  for (const [name, pool] of Object.entries(pools)) {
    if (!pool) continue;

    const start = Date.now();

    try {
      switch (name) {

        case 'pg': {
          const pgPool = pool as import('pg').Pool;
          await pgPool.query('SELECT 1');
          break;
        }

        case 'mysql': {
          const mysqlPool = pool as import('mysql2/promise').Pool;
          const conn = await mysqlPool.getConnection();
          await conn.query('SELECT 1');
          conn.release();
          break;
        }

        case 'mssql': {
          const mssqlPool = pool as import('mssql').ConnectionPool;
          await mssqlPool.request().query('SELECT 1');
          break;
        }

        case 'oracle': {
          const oraclePool = pool as import('oracledb').Pool;
          const conn = await oraclePool.getConnection();
          await conn.execute('SELECT 1 FROM dual');
          await conn.close();
          break;
        }

        case 'mongo': {
          const mongo = pool as import('mongodb').MongoClient;
          await mongo.db().command({ ping: 1 });
          break;
        }
      }

      results[name] = {
        status: 'UP',
        latency: Date.now() - start,
      };

    } catch (err: any) {
      results[name] = {
        status: 'DOWN',
        error: err.message,
      };
    }
  }

  return results;
}