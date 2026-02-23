import { MongoClient, Db, Collection, ObjectId } from 'mongodb';

export interface MongoDocument {
  _id?: ObjectId;
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  key: string;
  provider: 's3' | 'cloudinary' | 'local';
  publicId?: string;
  uploadedBy: string;
  entityType?: string;
  entityId?: string;
  folder?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  status: 'pending' | 'approved' | 'rejected' | 'archived';
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class DocumentCollections {
  constructor(private db: Db) {}

  get documents(): Collection<MongoDocument> {
    return this.db.collection<MongoDocument>('documents');
  }

  async createIndexes(): Promise<void> {
    await this.documents.createIndexes([
      { key: { id: 1 }, unique: true },
      { key: { uploadedBy: 1 } },
      { key: { entityType: 1, entityId: 1 } },
      { key: { status: 1 } },
      { key: { isDeleted: 1 } },
      { key: { createdAt: -1 } },
      { key: { tags: 1 } },
    ]);
  }
}

let mongoClient: MongoClient | null = null;
let mongoDB: Db | null = null;
let collections: DocumentCollections | null = null;

export async function getDocumentCollections(): Promise<DocumentCollections> {
  if (collections) return collections;
  const url = `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST || 'localhost'}:${process.env.MONGO_PORT || 27017}/${process.env.MONGO_DB}?authSource=admin`;
  mongoClient = new MongoClient(url, { maxPoolSize: 10, minPoolSize: 2 });
  await mongoClient.connect();
  mongoDB = mongoClient.db(process.env.MONGO_DB || 'ump_documents');
  collections = new DocumentCollections(mongoDB);
  await collections.createIndexes();
  return collections;
}

export async function disconnectMongo(): Promise<void> {
  if (mongoClient) { await mongoClient.close(); }
}
