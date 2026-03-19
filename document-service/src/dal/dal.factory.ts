import { connectPostgres } from '../database/connection';
import { getDocumentCollections } from '../database/mongo.schema';
import { PgDocumentDAL }           from './pg/document.dal.pg';
import { MongoDocumentDAL }        from './mongo/document.dal.mongo';
import type { IDocumentDAL }       from './interfaces/document.dal.interface';

export interface DocumentDALBundle {
  document: IDocumentDAL;
}

export class DocumentDALFactory {
  static async get(): Promise<DocumentDALBundle> {
    const dbType = process.env.DEFAULT_DB_TYPE || 'mongodb';

    if (dbType === 'postgres') {
      const db = await connectPostgres();
      return {
        document: new PgDocumentDAL(db as never),
      };
    }

    const collections = await getDocumentCollections();
    return {
      document: new MongoDocumentDAL(collections),
    };
  }
}

export type { IDocumentDAL };
