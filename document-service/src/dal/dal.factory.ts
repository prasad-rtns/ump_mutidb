import { DatabaseType } from '@prasad-rtns/shared';
import { drizzle as pgDrizzle } from 'drizzle-orm/node-postgres';
import { getMssqlPool, getPgPool, getMysqlDB } from '../database/adapters/db.connection';
import { getDocumentCollections } from '../database/mongo.schema';
import { PgDocumentDAL } from './pg/document.dal.pg';
import { MysqlDocumentDAL } from './mysql/document.dal.mysql';
import { MssqlDocumentDAL } from './mssql/document.dal.mssql';
import { MongoDocumentDAL } from './mongo/document.dal.mongo';
import type { IDocumentDAL } from './interfaces/document.dal.interface';

export interface DocumentDALBundle {
  document: IDocumentDAL;
}

export class DocumentDALFactory {
  static async get(dbType: DatabaseType = (process.env.DEFAULT_DB_TYPE || 'mysql') as DatabaseType): Promise<DocumentDALBundle> {
    switch (dbType) {
      case 'postgres': {
        const pool = await getPgPool();
        const db = pgDrizzle(pool);
        return { document: new PgDocumentDAL(db as never) };
      }

      case 'mysql': {
        const db = await getMysqlDB();
        return { document: new MysqlDocumentDAL(db) };
      }

      case 'mssql': {
        const pool = await getMssqlPool();
        return { document: new MssqlDocumentDAL(pool) };
      }

      case 'mongodb':
      default: {
        const collections = await getDocumentCollections();
        return { document: new MongoDocumentDAL(collections) };
      }
    }
  }
}

export type { IDocumentDAL };
