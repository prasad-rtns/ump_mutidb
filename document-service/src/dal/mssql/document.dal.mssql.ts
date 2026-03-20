import { ConnectionPool, NVarChar, Int, Bit, DateTime2 } from 'mssql';
import { v4 as uuidv4 } from 'uuid';
import { IDocumentDAL } from '../interfaces/document.dal.interface';
import {
  CreateDocumentDTO,
  Document,
  DocumentFilter,
  UpdateDocumentStatusDTO,
} from '../../modules/document_upload/document.types';
import { PaginatedResult } from '@prasad-rtns/shared';

const parseJson = <T>(value: unknown, fallback: T): T => {
  if (value == null) return fallback;
  if (typeof value !== 'string') return value as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const mapRow = (row: Record<string, unknown>): Document => ({
  id: row.id as string,
  name: row.name as string,
  originalName: row.original_name as string,
  mimeType: row.mime_type as string,
  size: Number(row.size),
  url: row.url as string,
  key: row.key as string,
  provider: row.provider as Document['provider'],
  publicId: (row.public_id ?? undefined) as string | undefined,
  uploadedBy: row.uploaded_by as string,
  entityType: (row.entity_type ?? undefined) as string | undefined,
  entityId: (row.entity_id ?? undefined) as string | undefined,
  folder: (row.folder ?? undefined) as string | undefined,
  tags: parseJson<string[]>(row.tags, []),
  metadata: parseJson<Record<string, unknown> | undefined>(row.metadata, undefined),
  status: row.status as Document['status'],
  isDeleted: Boolean(row.is_deleted),
  deletedAt: (row.deleted_at ?? undefined) as Date | undefined,
  deletedBy: (row.deleted_by ?? undefined) as string | undefined,
  createdBy: (row.created_by ?? undefined) as string | undefined,
  updatedBy: (row.updated_by ?? undefined) as string | undefined,
  createdAt: row.created_at as Date,
  updatedAt: row.updated_at as Date,
});

export class MssqlDocumentDAL implements IDocumentDAL {
  constructor(private readonly pool: ConnectionPool) {}

  async create(data: CreateDocumentDTO): Promise<Document> {
    const now = new Date();
    const request = this.pool.request();
    const id = uuidv4();

    request.input('id', NVarChar(36), id);
    request.input('name', NVarChar(255), data.name);
    request.input('original_name', NVarChar(255), data.originalName);
    request.input('mime_type', NVarChar(255), data.mimeType);
    request.input('size', Int, data.size);
    request.input('url', NVarChar, data.url);
    request.input('key', NVarChar, data.key);
    request.input('provider', NVarChar(50), data.provider);
    request.input('public_id', NVarChar(255), data.publicId ?? null);
    request.input('uploaded_by', NVarChar(255), data.uploadedBy);
    request.input('entity_type', NVarChar(100), data.entityType ?? null);
    request.input('entity_id', NVarChar(255), data.entityId ?? null);
    request.input('folder', NVarChar(255), data.folder ?? null);
    request.input('tags', NVarChar, JSON.stringify(data.tags ?? []));
    request.input('metadata', NVarChar, data.metadata ? JSON.stringify(data.metadata) : null);
    request.input('status', NVarChar(20), 'pending');
    request.input('is_deleted', Bit, false);
    request.input('created_by', NVarChar(255), data.uploadedBy);
    request.input('updated_by', NVarChar(255), data.uploadedBy);
    request.input('created_at', DateTime2, now);
    request.input('updated_at', DateTime2, now);

    const result = await request.query(`
      INSERT INTO dbo.documents (
        id, name, original_name, mime_type, size, url, [key], provider, public_id,
        uploaded_by, entity_type, entity_id, folder, tags, metadata, status,
        is_deleted, created_by, updated_by, created_at, updated_at
      )
      OUTPUT INSERTED.*
      VALUES (
        @id, @name, @original_name, @mime_type, @size, @url, @key, @provider, @public_id,
        @uploaded_by, @entity_type, @entity_id, @folder, @tags, @metadata, @status,
        @is_deleted, @created_by, @updated_by, @created_at, @updated_at
      )
    `);

    return mapRow(result.recordset[0]);
  }

  async createMany(data: CreateDocumentDTO[]): Promise<Document[]> {
    const docs = [];
    for (const item of data) {
      docs.push(await this.create(item));
    }
    return docs;
  }

  async findById(id: string): Promise<Document | null> {
    const result = await this.pool
      .request()
      .input('id', NVarChar(36), id)
      .query(`
        SELECT TOP 1 *
        FROM dbo.documents
        WHERE id = @id AND is_deleted = 0
      `);

    return result.recordset[0] ? mapRow(result.recordset[0]) : null;
  }

  async findFiltered(filter: DocumentFilter): Promise<PaginatedResult<Document>> {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 10;
    const offset = (page - 1) * limit;
    const request = this.pool.request();
    const conditions = ['is_deleted = @is_deleted'];

    request.input('is_deleted', Bit, filter.isDeleted ?? false);
    request.input('offset_rows', Int, offset);
    request.input('fetch_rows', Int, limit);

    if (filter.uploadedBy) {
      conditions.push('uploaded_by = @uploaded_by');
      request.input('uploaded_by', NVarChar(255), filter.uploadedBy);
    }
    if (filter.entityType) {
      conditions.push('entity_type = @entity_type');
      request.input('entity_type', NVarChar(100), filter.entityType);
    }
    if (filter.entityId) {
      conditions.push('entity_id = @entity_id');
      request.input('entity_id', NVarChar(255), filter.entityId);
    }
    if (filter.status) {
      conditions.push('[status] = @status');
      request.input('status', NVarChar(20), filter.status);
    }
    if (filter.provider) {
      conditions.push('provider = @provider');
      request.input('provider', NVarChar(50), filter.provider);
    }

    const whereClause = conditions.join(' AND ');
    const dataResult = await request.query(`
      SELECT *
      FROM dbo.documents
      WHERE ${whereClause}
      ORDER BY created_at DESC
      OFFSET @offset_rows ROWS FETCH NEXT @fetch_rows ROWS ONLY
    `);

    const countResult = await this.pool.request()
      .input('is_deleted', Bit, filter.isDeleted ?? false)
      .input('uploaded_by', NVarChar(255), filter.uploadedBy ?? null)
      .input('entity_type', NVarChar(100), filter.entityType ?? null)
      .input('entity_id', NVarChar(255), filter.entityId ?? null)
      .input('status', NVarChar(20), filter.status ?? null)
      .input('provider', NVarChar(50), filter.provider ?? null)
      .query(`
        SELECT COUNT(1) AS total
        FROM dbo.documents
        WHERE is_deleted = @is_deleted
          AND (@uploaded_by IS NULL OR uploaded_by = @uploaded_by)
          AND (@entity_type IS NULL OR entity_type = @entity_type)
          AND (@entity_id IS NULL OR entity_id = @entity_id)
          AND (@status IS NULL OR [status] = @status)
          AND (@provider IS NULL OR provider = @provider)
      `);

    return {
      data: dataResult.recordset.map(mapRow),
      total: Number(countResult.recordset[0]?.total ?? 0),
    };
  }

  async updateStatus(id: string, data: UpdateDocumentStatusDTO): Promise<Document | null> {
    const result = await this.pool
      .request()
      .input('id', NVarChar(36), id)
      .input('status', NVarChar(20), data.status)
      .input('updated_by', NVarChar(255), data.updatedBy)
      .input('updated_at', DateTime2, new Date())
      .query(`
        UPDATE dbo.documents
        SET [status] = @status, updated_by = @updated_by, updated_at = @updated_at
        OUTPUT INSERTED.*
        WHERE id = @id AND is_deleted = 0
      `);

    return result.recordset[0] ? mapRow(result.recordset[0]) : null;
  }

  async softDelete(id: string, deletedBy: string): Promise<boolean> {
    const result = await this.pool
      .request()
      .input('id', NVarChar(36), id)
      .input('deleted_by', NVarChar(255), deletedBy)
      .input('deleted_at', DateTime2, new Date())
      .input('updated_at', DateTime2, new Date())
      .query(`
        UPDATE dbo.documents
        SET is_deleted = 1,
            deleted_by = @deleted_by,
            deleted_at = @deleted_at,
            updated_at = @updated_at
        WHERE id = @id
      `);

    return result.rowsAffected[0] > 0;
  }

  async hardDelete(id: string): Promise<boolean> {
    const result = await this.pool
      .request()
      .input('id', NVarChar(36), id)
      .query('DELETE FROM dbo.documents WHERE id = @id');

    return result.rowsAffected[0] > 0;
  }

  async exists(id: string): Promise<boolean> {
    const result = await this.pool
      .request()
      .input('id', NVarChar(36), id)
      .query(`
        SELECT COUNT(1) AS total
        FROM dbo.documents
        WHERE id = @id AND is_deleted = 0
      `);

    return Number(result.recordset[0]?.total ?? 0) > 0;
  }

  async countByUser(uploadedBy: string): Promise<number> {
    const result = await this.pool
      .request()
      .input('uploaded_by', NVarChar(255), uploadedBy)
      .query(`
        SELECT COUNT(1) AS total
        FROM dbo.documents
        WHERE uploaded_by = @uploaded_by AND is_deleted = 0
      `);

    return Number(result.recordset[0]?.total ?? 0);
  }
}
