import { v4 as uuidv4 } from 'uuid';
import { IDocumentDAL } from '../interfaces/document.dal.interface';
import { Document, CreateDocumentDTO, DocumentFilter, UpdateDocumentStatusDTO } from '../../types';
import { DocumentCollections } from '../../database/mongo.schema';
import { PaginatedResult } from '@prasad-rtns/shared';

export class MongoDocumentDAL implements IDocumentDAL {
  constructor(private readonly collections: DocumentCollections) {}

  async create(data: CreateDocumentDTO): Promise<Document> {
    const now = new Date();
    const doc: Document = {
      id: uuidv4(), ...(data as any),
      status: 'pending',
      isDeleted: false,
      createdAt: now, updatedAt: now,
    };
    await this.collections.documents.insertOne(doc);
    return doc;
  }

  async createMany(data: CreateDocumentDTO[]): Promise<Document[]> {
    const now = new Date();
    const docs: Document[] = data.map(d => ({
      id: uuidv4(), ...d,
      status: 'pending' as const,
      isDeleted: false,
      createdAt: now, updatedAt: now,
    }));
    await this.collections.documents.insertMany(docs);
    return docs;
  }

  async findById(id: string): Promise<Document | null> {
    const doc = await this.collections.documents.findOne({ id, isDeleted: false });
    return doc as unknown as Document | null;
  }

  async findFiltered(filter: DocumentFilter): Promise<PaginatedResult<Document>> {
    const { page = 1, limit = 10, uploadedBy, entityType, entityId, status, provider } = filter;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = { isDeleted: filter.isDeleted ?? false };
    if (uploadedBy) query.uploadedBy = uploadedBy;
    if (entityType) query.entityType = entityType;
    if (entityId)   query.entityId   = entityId;
    if (status)     query.status     = status;
    if (provider)   query.provider   = provider;

    const [data, total] = await Promise.all([
      this.collections.documents
        .find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 })
        .toArray(),
      this.collections.documents.countDocuments(query),
    ]);
    return { data: data as unknown as Document[], total };
  }

  async updateStatus(id: string, data: UpdateDocumentStatusDTO): Promise<Document | null> {
    const result = await this.collections.documents.findOneAndUpdate(
      { id, isDeleted: false },
      { $set: { status: data.status, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    return result as unknown as Document | null;
  }

  async softDelete(id: string, deletedBy: string): Promise<boolean> {
    const result = await this.collections.documents.updateOne(
      { id },
      { $set: { isDeleted: true, deletedAt: new Date(), deletedBy, updatedAt: new Date() } }
    );
    return result.modifiedCount > 0;
  }

  async hardDelete(id: string): Promise<boolean> {
    const result = await this.collections.documents.deleteOne({ id });
    return result.deletedCount > 0;
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.collections.documents.countDocuments({ id, isDeleted: false });
    return count > 0;
  }

  async countByUser(uploadedBy: string): Promise<number> {
    return this.collections.documents.countDocuments({ uploadedBy, isDeleted: false });
  }
}
