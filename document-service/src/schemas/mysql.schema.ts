import { mysqlEnum, mysqlTable, varchar, text, int, json, boolean, timestamp, index, uniqueIndex } from 'drizzle-orm/mysql-core';

export const documents = mysqlTable('documents', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  originalName: varchar('original_name', { length: 255 }).notNull(),
  mimeType: varchar('mime_type', { length: 255 }).notNull(),
  size: int('size').notNull(),
  url: text('url').notNull(),
  key: varchar('key', { length: 512 }).notNull(),
  provider: mysqlEnum('provider', ['s3', 'cloudinary', 'local']).notNull(),
  publicId: varchar('public_id', { length: 255 }),
  uploadedBy: varchar('uploaded_by', { length: 255 }).notNull(),
  entityType: varchar('entity_type', { length: 100 }),
  entityId: varchar('entity_id', { length: 255 }),
  folder: varchar('folder', { length: 255 }),
  tags: json('tags').$type<string[]>().default([]),
  metadata: json('metadata').$type<Record<string, unknown> | null>(),
  status: mysqlEnum('status', ['pending', 'approved', 'rejected', 'archived']).default('pending').notNull(),
  isDeleted: boolean('is_deleted').default(false).notNull(),
  deletedAt: timestamp('deleted_at'),
  deletedBy: varchar('deleted_by', { length: 255 }),
  createdBy: varchar('created_by', { length: 255 }),
  updatedBy: varchar('updated_by', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  uploadedByIdx: index('documents_uploaded_by_idx').on(table.uploadedBy),
  entityIdx: index('documents_entity_idx').on(table.entityType, table.entityId),
  statusIdx: index('documents_status_idx').on(table.status),
  providerIdx: index('documents_provider_idx').on(table.provider),
  deletedIdx: index('documents_is_deleted_idx').on(table.isDeleted),
  createdByIdx: index('documents_created_by_idx').on(table.createdBy),
  updatedByIdx: index('documents_updated_by_idx').on(table.updatedBy),
  createdAtIdx: index('documents_created_at_idx').on(table.createdAt),
  keyIdx: uniqueIndex('documents_key_idx').on(table.key),
}));

export const mysqlSchema = {
  documents,
};
