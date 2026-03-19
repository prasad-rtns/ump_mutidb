import {
  pgTable, uuid, varchar, text, boolean, integer, timestamp, jsonb, index, uniqueIndex, pgEnum
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const documentStatusEnum = pgEnum('document_status', ['pending', 'approved', 'rejected', 'archived']);
export const storageProviderEnum = pgEnum('storage_provider', ['s3', 'cloudinary', 'local']);

export const documents = pgTable('documents', {
  id: uuid('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  originalName: varchar('original_name', { length: 255 }).notNull(),
  mimeType: varchar('mime_type', { length: 255 }).notNull(),
  size: integer('size').notNull(),
  url: text('url').notNull(),
  key: text('key').notNull(),
  provider: storageProviderEnum('provider').notNull(),
  publicId: varchar('public_id', { length: 255 }),
  uploadedBy: varchar('uploaded_by', { length: 255 }).notNull(),
  entityType: varchar('entity_type', { length: 100 }),
  entityId: varchar('entity_id', { length: 255 }),
  folder: varchar('folder', { length: 255 }),
  tags: jsonb('tags').$type<string[]>().default([]),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  status: documentStatusEnum('status').default('pending').notNull(),
  isDeleted: boolean('is_deleted').default(false).notNull(),
  deletedAt: timestamp('deleted_at'),
  deletedBy: varchar('deleted_by', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  uploadedByIdx: index('documents_uploaded_by_idx').on(table.uploadedBy),
  entityIdx: index('documents_entity_idx').on(table.entityType, table.entityId),
  statusIdx: index('documents_status_idx').on(table.status),
  providerIdx: index('documents_provider_idx').on(table.provider),
  deletedIdx: index('documents_is_deleted_idx').on(table.isDeleted),
  createdAtIdx: index('documents_created_at_idx').on(table.createdAt),
  keyIdx: uniqueIndex('documents_key_idx').on(table.key),
}));

export const documentsRelations = relations(documents, () => ({}));

/*export async function createDocumentTable(db: Pool) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS documents (
      id UUID PRIMARY KEY,
      name TEXT,
      original_name TEXT,
      mime_type TEXT,
      size INTEGER,
      url TEXT,
      key TEXT,
      provider VARCHAR(50),

      uploaded_by UUID,
      entity_type VARCHAR(100),
      entity_id VARCHAR(100),
      folder VARCHAR(255),

      tags TEXT[],
      metadata JSONB,

      status VARCHAR(50) DEFAULT 'pending',
      is_deleted BOOLEAN DEFAULT FALSE,

      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP,
      deleted_by UUID
    );

    CREATE INDEX IF NOT EXISTS idx_documents_entity
    ON documents(entity_type, entity_id);

    CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by
    ON documents(uploaded_by);

    CREATE INDEX IF NOT EXISTS idx_documents_status
    ON documents(status);
  `);
}*/
export const pgSchema = {
  documents,
};
