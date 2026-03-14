import { and, count, desc, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { v4 as uuidv4 } from 'uuid';
import { documents } from '../../schemas/pg.schema';
import { IDocumentDAL } from '../interfaces/document.dal.interface';
import {
  CreateDocumentDTO,
  Document,
  DocumentFilter,
  UpdateDocumentStatusDTO,
} from '../../modules/document_upload/document.types';
import { PaginatedResult } from '@prasad-rtns/shared';

type PgDB = NodePgDatabase<Record<string, never>>;

export class PgDocumentDAL implements IDocumentDAL {
  constructor(private readonly db: PgDB) {}

  async create(data: CreateDocumentDTO): Promise<Document> {
    const now = new Date();
    const rows = await this.db
      .insert(documents)
      .values({
        id: uuidv4(),
        ...data,
        status: 'pending',
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return rows[0] as unknown as Document;
  }

  async createMany(data: CreateDocumentDTO[]): Promise<Document[]> {
    if (!data.length) return [];
    const now = new Date();
    const rows = await this.db
      .insert(documents)
      .values(
        data.map((item) => ({
          id: uuidv4(),
          ...item,
          status: 'pending' as const,
          isDeleted: false,
          createdAt: now,
          updatedAt: now,
        }))
      )
      .returning();
    return rows as unknown as Document[];
  }

  async findById(id: string): Promise<Document | null> {
    const rows = await this.db
      .select()
      .from(documents)
      .where(and(eq(documents.id, id), eq(documents.isDeleted, false)))
      .limit(1);
    return (rows[0] as unknown as Document) ?? null;
  }

  async findFiltered(filter: DocumentFilter): Promise<PaginatedResult<Document>> {
    const {
      page = 1,
      limit = 10,
      uploadedBy,
      entityType,
      entityId,
      status,
      provider,
    } = filter;
    const offset = (page - 1) * limit;
    const conditions = [eq(documents.isDeleted, filter.isDeleted ?? false)];

    if (uploadedBy) conditions.push(eq(documents.uploadedBy, uploadedBy));
    if (entityType) conditions.push(eq(documents.entityType, entityType));
    if (entityId) conditions.push(eq(documents.entityId, entityId));
    if (status) conditions.push(eq(documents.status, status));
    if (provider) conditions.push(eq(documents.provider, provider));

    const where = and(...conditions);
    const [data, [{ total }]] = await Promise.all([
      this.db
        .select()
        .from(documents)
        .where(where)
        .orderBy(desc(documents.createdAt))
        .limit(limit)
        .offset(offset),
      this.db.select({ total: count() }).from(documents).where(where),
    ]);

    return { data: data as unknown as Document[], total: Number(total) };
  }

  async updateStatus(id: string, data: UpdateDocumentStatusDTO): Promise<Document | null> {
    const rows = await this.db
      .update(documents)
      .set({
        status: data.status,
        updatedAt: new Date(),
      })
      .where(and(eq(documents.id, id), eq(documents.isDeleted, false)))
      .returning();
    return (rows[0] as unknown as Document) ?? null;
  }

  async softDelete(id: string, deletedBy: string): Promise<boolean> {
    const rows = await this.db
      .update(documents)
      .set({
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy,
        updatedAt: new Date(),
      })
      .where(eq(documents.id, id))
      .returning({ id: documents.id });
    return rows.length > 0;
  }

  async hardDelete(id: string): Promise<boolean> {
    const rows = await this.db
      .delete(documents)
      .where(eq(documents.id, id))
      .returning({ id: documents.id });
    return rows.length > 0;
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
