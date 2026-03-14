export type DocumentStatus   = 'pending' | 'approved' | 'rejected' | 'archived';
export type StorageProviderKey = 's3' | 'cloudinary' | 'local';

export interface Document {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  key: string;
  provider: StorageProviderKey;
  publicId?: string;
  uploadedBy: string;
  entityType?: string;
  entityId?: string;
  folder?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  status: DocumentStatus;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDocumentDTO {
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  key: string;
  provider: StorageProviderKey;
  publicId?: string;
  uploadedBy: string;
  entityType?: string;
  entityId?: string;
  folder?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface DocumentFilter {
  page?: number;
  limit?: number;
  uploadedBy?: string;
  entityType?: string;
  entityId?: string;
  status?: DocumentStatus;
  provider?: StorageProviderKey;
  isDeleted?: boolean;
}

export interface UpdateDocumentStatusDTO {
  status: DocumentStatus;
  updatedBy: string;
}
