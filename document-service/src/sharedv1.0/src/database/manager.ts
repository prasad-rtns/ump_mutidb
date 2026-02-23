import { DatabaseType, DatabaseConfig } from '../types';
import { createLogger } from '../utils/logger';

const logger = createLogger('db-manager');

// ─── Drizzle adapters (lazy-loaded per request) ────────────────────────────────
export class DatabaseManager {
  private static connections: Map<DatabaseType, unknown> = new Map();

  static getConfig(type: DatabaseType): DatabaseConfig {
    const configs: Record<DatabaseType, DatabaseConfig> = {
      postgres: {
        type: 'postgres',
        host: process.env.POSTGRES_HOST || 'postgres',
        port: parseInt(process.env.POSTGRES_PORT || '5432'),
        database: process.env.POSTGRES_DB || 'ump_db',
        username: process.env.POSTGRES_USER || 'ump_user',
        password: process.env.POSTGRES_PASSWORD || '',
        ssl: process.env.POSTGRES_SSL === 'true',
        poolMin: 2,
        poolMax: 10,
      },
      mysql: {
        type: 'mysql',
        host: process.env.MYSQL_HOST || 'mysql',
        port: parseInt(process.env.MYSQL_PORT || '3306'),
        database: process.env.MYSQL_DB || 'ump_db',
        username: process.env.MYSQL_USER || 'ump_user',
        password: process.env.MYSQL_PASSWORD || '',
        poolMin: 2,
        poolMax: 10,
      },
      mssql: {
        type: 'mssql',
        host: process.env.MSSQL_HOST || 'mssql',
        port: parseInt(process.env.MSSQL_PORT || '1433'),
        database: process.env.MSSQL_DB || 'ump_db',
        username: process.env.MSSQL_USER || 'sa',
        password: process.env.MSSQL_PASSWORD || '',
        poolMin: 2,
        poolMax: 10,
      },
      oracle: {
        type: 'oracle',
        host: process.env.ORACLE_HOST || 'oracle',
        port: parseInt(process.env.ORACLE_PORT || '1521'),
        database: process.env.ORACLE_SERVICE || 'ORCL',
        username: process.env.ORACLE_USER || 'ump_user',
        password: process.env.ORACLE_PASSWORD || '',
        poolMin: 2,
        poolMax: 10,
      },
      mongodb: {
        type: 'mongodb',
        url: `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST || 'mongodb'}:${process.env.MONGO_PORT || 27017}/${process.env.MONGO_DB}?authSource=admin`,
        database: process.env.MONGO_DB || 'ump_db',
      },
    };
    return configs[type];
  }

  static async getPostgresConnection() {
    const { drizzle } = await import('drizzle-orm/node-postgres');
    const { Pool } = await import('pg');
    const cfg = this.getConfig('postgres');
    const pool = new Pool({
      host: cfg.host,
      port: cfg.port,
      database: cfg.database,
      user: cfg.username,
      password: cfg.password,
      ssl: cfg.ssl ? { rejectUnauthorized: false } : undefined,
      min: cfg.poolMin,
      max: cfg.poolMax,
    });
    return drizzle(pool);
  }

  static async getMysqlConnection() {
    const { drizzle } = await import('drizzle-orm/mysql2');
    const mysql = await import('mysql2/promise');
    const cfg = this.getConfig('mysql');
    const pool = mysql.createPool({
      host: cfg.host,
      port: cfg.port,
      database: cfg.database,
      user: cfg.username,
      password: cfg.password,
      waitForConnections: true,
      connectionLimit: cfg.poolMax || 10,
    });
    return drizzle(pool);
  }

  static async getMssqlConnection() {
    const mssql = await import('mssql');
    const cfg = this.getConfig('mssql');
    const pool = await mssql.connect({
      server: cfg.host || 'mssql',
      port: cfg.port,
      database: cfg.database,
      user: cfg.username,
      password: cfg.password,
      options: { encrypt: true, trustServerCertificate: true },
      pool: { min: cfg.poolMin, max: cfg.poolMax },
    });
    return { pool, type: 'mssql' as const };
  }

  static async getMongoConnection() {
    const { MongoClient } = await import('mongodb');
    const cfg = this.getConfig('mongodb');
    if (this.connections.has('mongodb')) {
      return this.connections.get('mongodb') as { client: InstanceType<typeof MongoClient>; db: ReturnType<InstanceType<typeof MongoClient>['db']> };
    }
    const client = new MongoClient(cfg.url!);
    await client.connect();
    const db = client.db(cfg.database);
    this.connections.set('mongodb', { client, db });
    logger.info('MongoDB connected');
    return { client, db };
  }

  static async getConnection(type: DatabaseType) {
    switch (type) {
      case 'postgres': return this.getPostgresConnection();
      case 'mysql': return this.getMysqlConnection();
      case 'mssql': return this.getMssqlConnection();
      case 'mongodb': return this.getMongoConnection();
      default:
        logger.warn(`DB type ${type} not fully configured, falling back to postgres`);
        return this.getPostgresConnection();
    }
  }

  static async healthCheck(type: DatabaseType): Promise<boolean> {
    try {
      if (type === 'mongodb') {
        const { db } = await this.getMongoConnection();
        await db.command({ ping: 1 });
        return true;
      }
      const conn = await this.getConnection(type) as { execute?: (q: string) => Promise<unknown> };
      if (conn && typeof conn.execute === 'function') {
        await conn.execute('SELECT 1');
      }
      return true;
    } catch {
      return false;
    }
  }
}
