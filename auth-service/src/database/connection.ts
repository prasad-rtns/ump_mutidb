import { drizzle as pgDrizzle } from 'drizzle-orm/node-postgres';
import { drizzle as mysqlDrizzle } from 'drizzle-orm/mysql2';
import { Pool as PgPool } from 'pg';
import mysql from 'mysql2/promise';
import { MongoClient, Db } from 'mongodb';
import { DatabaseType } from '@prasad-rtns/shared';
import { pgSchema } from '../schemas/pg.schema';
import { MongoCollections } from '../schemas/mongo.schema';
import logger from './logger';

type PgDB = ReturnType<typeof pgDrizzle>;
type MysqlDB = ReturnType<typeof mysqlDrizzle>;

interface ConnectionState {
  pgPool?: PgPool;
  pgDB?: PgDB;
  mysqlPool?: mysql.Pool;
  mysqlDB?: MysqlDB;
  mongoClient?: MongoClient;
  mongoDB?: Db;
  mongoCollections?: MongoCollections;
}

const state: ConnectionState = {};

// ─── PostgreSQL ───────────────────────────────────────────────────────────────
export async function connectPostgres(): Promise<PgDB> {
  if (state.pgDB) return state.pgDB;
  state.pgPool = new PgPool({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    database: process.env.POSTGRES_DB || 'ump_auth',
    user: process.env.POSTGRES_USER || 'ump_user',
    password: process.env.POSTGRES_PASSWORD || '',
    ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    min: 2,
    max: 10,
  });
  state.pgPool.on('error', (err) => logger.error('PG pool error', { error: err.message }));
  state.pgDB = pgDrizzle(state.pgPool, { schema: pgSchema });
  logger.info('PostgreSQL connected');
  return state.pgDB;
}

// ─── MySQL ────────────────────────────────────────────────────────────────────
export async function connectMysql(): Promise<MysqlDB> {
  if (state.mysqlDB) return state.mysqlDB;
  state.mysqlPool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    database: process.env.MYSQL_DB || 'ump_auth',
    user: process.env.MYSQL_USER || 'ump_user',
    password: process.env.MYSQL_PASSWORD || '',
    waitForConnections: true,
    connectionLimit: 10,
    enableKeepAlive: true,
  });
  state.mysqlDB = mysqlDrizzle(state.mysqlPool);
  logger.info('MySQL connected');
  return state.mysqlDB;
}

// ─── MongoDB ──────────────────────────────────────────────────────────────────
export async function connectMongo(): Promise<{ db: Db; collections: MongoCollections }> {
  if (state.mongoDB && state.mongoCollections) {
    return { db: state.mongoDB, collections: state.mongoCollections };
  }
  const url = `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST || 'localhost'}:${process.env.MONGO_PORT || 27017}/${process.env.MONGO_DB}?authSource=admin`;
  state.mongoClient = new MongoClient(url, {
    serverSelectionTimeoutMS: 5000,
    maxPoolSize: 10,
    minPoolSize: 2,
  });
  await state.mongoClient.connect();
  state.mongoDB = state.mongoClient.db(process.env.MONGO_DB || 'ump_auth');
  state.mongoCollections = new MongoCollections(state.mongoDB);
  await state.mongoCollections.createIndexes();
  logger.info('MongoDB connected');
  return { db: state.mongoDB, collections: state.mongoCollections };
}

// ─── Get connection by type ───────────────────────────────────────────────────
export async function getDbConnection(type: DatabaseType) {
  switch (type) {
    case 'postgres': return { type: 'postgres', db: await connectPostgres() };
    case 'mysql': return { type: 'mysql', db: await connectMysql() };
    case 'mongodb': return { type: 'mongodb', ...(await connectMongo()) };
    default:
      logger.warn(`DB type ${type} not configured, falling back to postgres`);
      return { type: 'postgres', db: await connectPostgres() };
  }
}

// ─── Health checks ────────────────────────────────────────────────────────────
export async function checkDbHealth(): Promise<Record<string, boolean>> {
  const results: Record<string, boolean> = {};
  
  try {
    const pg = await connectPostgres();
    await (pg as unknown as { execute: (q: string) => Promise<unknown> }).execute?.('SELECT 1');
    results.postgres = true;
  } catch { results.postgres = false; }
  
  try {
    if (state.mysqlPool) {
      const conn = await state.mysqlPool.getConnection();
      await conn.ping();
      conn.release();
      results.mysql = true;
    } else {
      results.mysql = false;
    }
  } catch { results.mysql = false; }
  
  try {
    if (state.mongoClient) {
      await state.mongoClient.db('admin').command({ ping: 1 });
      results.mongodb = true;
    } else {
      results.mongodb = false;
    }
  } catch { results.mongodb = false; }
  
  return results;
}

// ─── Graceful disconnect ──────────────────────────────────────────────────────
export async function disconnectAll(): Promise<void> {
  if (state.pgPool) { await state.pgPool.end(); logger.info('PostgreSQL disconnected'); }
  if (state.mysqlPool) { await state.mysqlPool.end(); logger.info('MySQL disconnected'); }
  if (state.mongoClient) { await state.mongoClient.close(); logger.info('MongoDB disconnected'); }
}
