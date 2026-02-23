import { DocumentDALFactory, DocumentDALBundle }          from '../dal/dal.factory';
import { getStorageProvider, StorageProviderType }         from '../providers/storage.provider';
import { CacheService }                                    from '@prasad-rtns/shared';
import { Document, CreateDocumentDTO, DocumentFilter, DocumentStatus, StorageProviderKey } from '../types';
import logger from '../controllers/logger';

const cache = new CacheService('documents');

export interface UploadInput {
  file: Express.Multer.File;
  provider?: StorageProviderType;
  folder?: string;
  name?: string;
  entityType?: string;
  entityId?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  uploadedBy: string;
}

export class DocumentService {
  private dal!: DocumentDALBundle;
  private constructor() {}

  static async create(): Promise<DocumentService> {
    const svc = new DocumentService();
    svc.dal   = await DocumentDALFactory.get();
    return svc;
  }

  // ─── Upload single file ───────────────────────────────────────────────────────
  async uploadSingle(input: UploadInput): Promise<Document> {
    const storage  = getStorageProvider(input.provider);
    const folder   = input.folder ?? 'general';
    const uploaded = await storage.upload(input.file, folder);

    const dto: CreateDocumentDTO = {
      name:         input.name ?? input.file.originalname,
      originalName: uploaded.originalName,
      mimeType:     uploaded.mimeType,
      size:         uploaded.size,
      url:          uploaded.url,
      key:          uploaded.key,
      provider:     uploaded.provider as StorageProviderKey,
      publicId:     uploaded.publicId,
      uploadedBy:   input.uploadedBy,
      entityType:   input.entityType,
      entityId:     input.entityId,
      folder,
      tags:         input.tags,
      metadata:     input.metadata,
    };

    const doc = await this.dal.document.create(dto);
    logger.info('Document uploaded', { docId: doc.id, provider: doc.provider, uploadedBy: doc.uploadedBy });
    return doc;
  }

  // ─── Upload multiple files ────────────────────────────────────────────────────
  async uploadBulk(inputs: UploadInput[]): Promise<Document[]> {
    const storage = getStorageProvider(inputs[0]?.provider);
    const folder  = inputs[0]?.folder ?? 'general';

    const uploads = await Promise.all(
      inputs.map(input => storage.upload(input.file, folder))
    );

    const dtos: CreateDocumentDTO[] = uploads.map((uploaded, i) => ({
      name:         inputs[i].name ?? inputs[i].file.originalname,
      originalName: uploaded.originalName,
      mimeType:     uploaded.mimeType,
      size:         uploaded.size,
      url:          uploaded.url,
      key:          uploaded.key,
      provider:     uploaded.provider as StorageProviderKey,
      publicId:     uploaded.publicId,
      uploadedBy:   inputs[i].uploadedBy,
      entityType:   inputs[i].entityType,
      entityId:     inputs[i].entityId,
      folder,
      tags:         inputs[i].tags,
      metadata:     inputs[i].metadata,
    }));

    const docs = await this.dal.document.createMany(dtos);
    logger.info('Bulk upload complete', { count: docs.length, uploadedBy: inputs[0]?.uploadedBy });
    return docs;
  }

  // ─── List documents (role-scoped) ────────────────────────────────────────────
  async listDocuments(filter: DocumentFilter) {
    const key    = `list:${JSON.stringify(filter)}`;
    const cached = await cache.get<{ data: Document[]; total: number }>(key);
    if (cached) return cached;

    const result = await this.dal.document.findFiltered(filter);
    await cache.set(key, result, 60);
    return result;
  }

  // ─── Get single document ──────────────────────────────────────────────────────
  async getById(id: string, requesterId: string, requesterRole: string): Promise<Document> {
    const doc = await this.dal.document.findById(id);
    if (!doc) throw new Error('Document not found');

    const canAccess =
      requesterRole === 'admin' ||
      requesterRole === 'lead'  ||
      doc.uploadedBy === requesterId;
    if (!canAccess) throw new Error('Access denied');

    return doc;
  }

  // ─── Get download / signed URL ────────────────────────────────────────────────
  async getDownloadUrl(id: string, requesterId: string, requesterRole: string): Promise<string> {
    const doc     = await this.getById(id, requesterId, requesterRole);
    const storage = getStorageProvider(doc.provider as StorageProviderType);

    if (typeof (storage as { getSignedUrl?: (key: string, exp: number) => Promise<string> }).getSignedUrl === 'function') {
      return (storage as { getSignedUrl: (key: string, exp: number) => Promise<string> })
        .getSignedUrl(doc.key, 3600);
    }
    return doc.url;
  }

  // ─── Update document status ───────────────────────────────────────────────────
  async updateStatus(id: string, status: DocumentStatus, updatedBy: string): Promise<Document> {
    const doc = await this.dal.document.findById(id);
    if (!doc) throw new Error('Document not found');

    const updated = await this.dal.document.updateStatus(id, { status, updatedBy });
    if (!updated) throw new Error('Status update failed');

    await cache.del(`doc:${id}`);
    await cache.delPattern('list:*');
    logger.info(`Document status → ${status}`, { docId: id, updatedBy });
    return updated;
  }

  // ─── Delete document (soft + storage cleanup) ─────────────────────────────────
  async deleteDocument(id: string, requesterId: string, requesterRole: string): Promise<{ message: string }> {
    const doc = await this.getById(id, requesterId, requesterRole);

    // Remove from storage
    try {
      const storage = getStorageProvider(doc.provider as StorageProviderType);
      await storage.delete(doc.key);
    } catch (err) {
      logger.warn('Storage delete failed (soft deleting anyway)', { docId: id, err });
    }

    await this.dal.document.softDelete(id, requesterId);
    await cache.del(`doc:${id}`);
    await cache.delPattern('list:*');
    logger.info('Document deleted', { docId: id, deletedBy: requesterId });
    return { message: 'Document deleted successfully' };
  }
}
