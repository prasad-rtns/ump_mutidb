import { getDocumentCollections } from '../database/mongo.schema';
import { MongoDocumentDAL }        from './mongo/document.dal.mongo';
import type { IDocumentDAL }       from './interfaces/document.dal.interface';

export interface DocumentDALBundle {
  document: IDocumentDAL;
}

export class DocumentDALFactory {
  /**
   * Document metadata is always stored in MongoDB regardless of the
   * X-DB-Type header (binary files are stored in S3/Cloudinary/local).
   */
  static async get(): Promise<DocumentDALBundle> {
    const collections = await getDocumentCollections();
    return {
      document: new MongoDocumentDAL(collections),
    };
  }
}

export type { IDocumentDAL };
