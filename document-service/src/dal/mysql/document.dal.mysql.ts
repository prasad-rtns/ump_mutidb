import { and, count, desc, eq } from 'drizzle-orm';
import type { MySql2Database } from 'drizzle-orm/mysql2';
import { v4 as uuidv4 } from 'uuid';
import { documents } from '../../schemas/mysql.schema';
import { IDocumentDAL } from '../interfaces/document.dal.interface';
import { CreateDocumentDTO, Document, DocumentFilter, UpdateDocumentStatusDTO } from '../../modules/document_upload/document.types';
import { PaginatedResult } from '@rtns/core';

type MysqlDB = MySql2Database<any>;

export class MysqlDocumentDAL implements IDocumentDAL {
  constructor(private readonly db: MysqlDB) {}

  async create(data: CreateDocumentDTO): Promise<Document> {
    const id = uuidv4();
    const timestamp = new Date();

    await this.db.insert(documents).values({
      id,
      ...data,
      status: 'pending',
      isDeleted: false,
      createdAt: timestamp,
      updatedAt: timestamp,
      createdBy: data.uploadedBy,
      updatedBy: data.uploadedBy,
    });

    return (await this.findById(id))!;
  }

  async createMany(data: CreateDocumentDTO[]): Promise<Document[]> {
    const docs: Document[] = [];
    for (const item of data) {
      docs.push(await this.create(item));
    }
    return docs;
  }

  async findById(id: string): Promise<Document | null> {
    const rows = await this.db
      .select()
      .from(documents)
      .where(and(eq(documents.id, id), eq(documents.isDeleted, false)))
      .limit(1);
    return (rows[0] as Document | undefined) ?? null;
  }

  async findFiltered(filter: DocumentFilter): Promise<PaginatedResult<Document>> {
    const { page = 1, limit = 10, uploadedBy, entityType, entityId, status, provider } = filter;
    const offset = (page - 1) * limit;
    const conditions = [eq(documents.isDeleted, filter.isDeleted ?? false)];

    if (uploadedBy) conditions.push(eq(documents.uploadedBy, uploadedBy));
    if (entityType) conditions.push(eq(documents.entityType, entityType));
    if (entityId) conditions.push(eq(documents.entityId, entityId));
    if (status) conditions.push(eq(documents.status, status));
    if (provider) conditions.push(eq(documents.provider, provider));

    const where = and(...conditions);
    const [data, totals] = await Promise.all([
      this.db.select().from(documents).where(where).orderBy(desc(documents.createdAt)).limit(limit).offset(offset),
      this.db.select({ total: count() }).from(documents).where(where),
    ]);

    return {
      data: data as Document[],
      total: Number(totals[0]?.total ?? 0),
    };
  }

  async updateStatus(id: string, data: UpdateDocumentStatusDTO): Promise<Document | null> {
    await this.db
      .update(documents)
      .set({ status: data.status, updatedBy: data.updatedBy, updatedAt: new Date() })
      .where(and(eq(documents.id, id), eq(documents.isDeleted, false)));
    return this.findById(id);
  }

  async softDelete(id: string, deletedBy: string): Promise<boolean> {
    await this.db
      .update(documents)
      .set({ isDeleted: true, deletedAt: new Date(), deletedBy, updatedAt: new Date(), updatedBy: deletedBy })
      .where(eq(documents.id, id));
    return true;
  }

  async hardDelete(id: string): Promise<boolean> {
    await this.db.delete(documents).where(eq(documents.id, id));
    return true;
  }

  async exists(id: string): Promise<boolean> {
    const rows = await this.db
      .select({ total: count() })
      .from(documents)
      .where(and(eq(documents.id, id), eq(documents.isDeleted, false)));
    return Number(rows[0]?.total ?? 0) > 0;
  }

  async countByUser(uploadedBy: string): Promise<number> {
    const rows = await this.db
      .select({ total: count() })
      .from(documents)
      .where(and(eq(documents.uploadedBy, uploadedBy), eq(documents.isDeleted, false)));
    return Number(rows[0]?.total ?? 0);
  }
}
