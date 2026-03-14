import { DatabaseType } from '@prasad-rtns/shared';
import logger from '../logger';
import { MongoCollections } from '../../schemas/mongo.schema';
import { MongoClient, Db } from 'mongodb';

// ─────────────────────────────────────────────────────────────────────────────
//  Import DB drivers lazily to avoid loading unused drivers at startup
// ─────────────────────────────────────────────────────────────────────────────
let _pgPool:    import('pg').Pool                 | null = null;
let _mysqlPool: import('mysql2/promise').Pool     | null = null;
let _mssqlPool: import('mssql').ConnectionPool   | null = null;
let _oraclePool: import('oracledb').Pool         | null = null;
let _mongoClient: import('mongodb').MongoClient  | null = null;

// 👇 add this export helper
export function getDbPools() {
  return {
    pg: _pgPool,
    mysql: _mysqlPool,
    mssql: _mssqlPool,
    oracle: _oraclePool,
    mongo: _mongoClient
  };
}

// ─── PostgreSQL ───────────────────────────────────────────────────────────────
export async function getPgPool() {
  if (_pgPool) return _pgPool;
  const { Pool } = await import('pg');
  _pgPool = new Pool({
    host:     process.env.POSTGRES_HOST     || 'localhost',
    port:     parseInt(process.env.POSTGRES_PORT || '5432'),
    database: process.env.POSTGRES_DB       || 'ump_db',
    user:     process.env.POSTGRES_USER     || 'ump_user',
    password: process.env.POSTGRES_PASSWORD || '',
    min: 2, max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });
  _pgPool.on('error', err => logger.error('PG Pool error', { err: err.message }));
  logger.info('PostgreSQL pool created');
  return _pgPool;
}

// ─── MySQL ────────────────────────────────────────────────────────────────────
export async function getMysqlPool() {
  if (_mysqlPool) return _mysqlPool;
  const mysql = await import('mysql2/promise');
  _mysqlPool = mysql.createPool({
    host:            process.env.MYSQL_HOST     || 'localhost',
    port:            parseInt(process.env.MYSQL_PORT || '3306'),
    database:        process.env.MYSQL_DB       || 'ump_db',
    user:            process.env.MYSQL_USER     || 'ump_user',
    password:        process.env.MYSQL_PASSWORD || '',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit:      0,
    connectTimeout:  10_000,
  });
  logger.info('MySQL pool created');
  return _mysqlPool;
}

// ─── MSSQL (SQL Server) ───────────────────────────────────────────────────────
export async function getMssqlPool() {
  if (_mssqlPool && _mssqlPool.connected) return _mssqlPool;
  const sql = await import('mssql');
  const config: import('mssql').config = {
    server:   process.env.MSSQL_HOST     || 'localhost',
    port:     parseInt(process.env.MSSQL_PORT || '1433'),
    database: process.env.MSSQL_DB       || 'ump_db',
    user:     process.env.MSSQL_USER     || 'sa',
    password: process.env.MSSQL_PASSWORD || '',
    pool: {
      min: 2,
      max: 10,
      idleTimeoutMillis: 30_000,
    },
    options: {
      encrypt:                true,  // required for Azure SQL
      trustServerCertificate: process.env.MSSQL_TRUST_CERT === 'true' || process.env.NODE_ENV !== 'production',
      enableArithAbort:       true,
    },
    connectionTimeout: 15_000,
    requestTimeout:    30_000,
  };
  _mssqlPool = new sql.ConnectionPool(config);
  await _mssqlPool.connect();
  _mssqlPool.on('error', err => logger.error('MSSQL Pool error', { err: err.message }));
  logger.info('MSSQL pool connected', {
    server: config.server,
    database: config.database,
  });
  return _mssqlPool;
}

// ─── Oracle DB ────────────────────────────────────────────────────────────────
export async function getOraclePool() {
  if (_oraclePool) return _oraclePool;
  const oracledb = await import('oracledb');

  // Enable automatic result-set rows as objects
  oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
  oracledb.autoCommit = true;

  _oraclePool = await oracledb.createPool({
    user:              process.env.ORACLE_USER     || 'ump_user',
    password:          process.env.ORACLE_PASSWORD || '',
    connectionString:  process.env.ORACLE_CONN_STR
                       || `${process.env.ORACLE_HOST || 'localhost'}:${process.env.ORACLE_PORT || '1521'}/${process.env.ORACLE_SID || 'XE'}`,
    poolMin:           2,
    poolMax:           10,
    poolIncrement:     2,
    poolTimeout:       60,
    stmtCacheSize:     30,
  });

  logger.info('Oracle pool created', {
    connectionString: process.env.ORACLE_CONN_STR ?? `${process.env.ORACLE_HOST}:${process.env.ORACLE_PORT}/${process.env.ORACLE_SID}`,
  });
  return _oraclePool;
}

// ─── MongoDB ──────────────────────────────────────────────────────────────────
export async function getMongoClient(): Promise<{
  client: MongoClient;
  db: Db;
  collections: MongoCollections;
}> {
  if (_mongoClient) {
    const db = _mongoClient.db(process.env.MONGO_DB || 'ump_auth');
    return {
      client: _mongoClient,
      db,
      collections: new MongoCollections(db),
    };
  }

  const { MongoClient } = await import('mongodb');

  const url =
    process.env.MONGO_URL ||
    `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST || 'localhost'}:${process.env.MONGO_PORT || 27017}/${process.env.MONGO_DB}?authSource=admin`;

  _mongoClient = new MongoClient(url, {
    maxPoolSize: 10,
    minPoolSize: 2,
    connectTimeoutMS: 10_000,
    socketTimeoutMS: 30_000,
  });

  await _mongoClient.connect();

  const db = _mongoClient.db(process.env.MONGO_DB || 'ump_auth');
  const collections = new MongoCollections(db);

  await collections.createIndexes();

  logger.info('MongoDB client connected');

  return {
    client: _mongoClient,
    db,
    collections,
  };
}

// ─── Health check for any pool ────────────────────────────────────────────────
export async function checkDbHealth(dbType: DatabaseType): Promise<{ ok: boolean; dbType: DatabaseType; error?: string }> {
  try {
    switch (dbType) {
      case 'postgres': {
        const pool = await getPgPool();
        const c = await pool.connect();
        await c.query('SELECT 1');
        c.release();
        break;
      }
      case 'mysql': {
        const pool = await getMysqlPool();
        const conn = await pool.getConnection();
        await (conn as import('mysql2/promise').PoolConnection).query('SELECT 1');
        (conn as import('mysql2/promise').PoolConnection).release();
        break;
      }
      case 'mssql': {
        const pool = await getMssqlPool();
        await pool.request().query('SELECT 1 AS ok');
        break;
      }
      case 'oracle': {
        const pool = await getOraclePool();
        const conn = await pool.getConnection();
        await conn.execute('SELECT 1 FROM DUAL');
        await conn.close();
        break;
      }
      case 'mongodb': {
        const { db } = await getMongoClient();
        await db.command({ ping: 1 });
        break;
      }
    }
    return { ok: true, dbType };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    logger.error(`DB health check failed for ${dbType}`, { error });
    return { ok: false, dbType, error };
  }
}

// ─── Graceful shutdown ────────────────────────────────────────────────────────
export async function closeAllPools(): Promise<void> {
  const tasks: Promise<void>[] = [];
  if (_pgPool)     tasks.push(_pgPool.end().then(() => { logger.info('PG pool closed'); }));
  if (_mysqlPool)  tasks.push(_mysqlPool.end().then(() => { logger.info('MySQL pool closed'); }));
  if (_mssqlPool)  tasks.push(_mssqlPool.close().then(() => { logger.info('MSSQL pool closed'); }));
  if (_oraclePool) tasks.push(_oraclePool.close(0).then(() => { logger.info('Oracle pool closed'); }));
  if (_mongoClient) tasks.push(_mongoClient.close().then(() => { logger.info('MongoDB client closed'); }));
  await Promise.allSettled(tasks);
}
