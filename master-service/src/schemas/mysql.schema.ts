import {
  mysqlTable,
  varchar,
  boolean,
  datetime,
  int,
  json,
  decimal
} from 'drizzle-orm/mysql-core';

/* ───────────── Countries ───────────── */

export const countries = mysqlTable('countries', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  code: varchar('code', { length: 3 }).notNull(),

  dialCode: varchar('dial_code', { length: 10 }),
  flag: varchar('flag', { length: 10 }),
  currency: varchar('currency', { length: 10 }),
  currencySymbol: varchar('currency_symbol', { length: 10 }),

  isActive: boolean('is_active').notNull(),
  createdAt: datetime('created_at').notNull(),
  updatedAt: datetime('updated_at').notNull(),
});

/* ───────────── States ───────────── */

export const states = mysqlTable('states', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  code: varchar('code', { length: 10 }).notNull(),
  countryId: varchar('country_id', { length: 36 }).notNull(),

  isActive: boolean('is_active').notNull(),
  createdAt: datetime('created_at').notNull(),
  updatedAt: datetime('updated_at').notNull(),
});

/* ───────────── Cities ───────────── */

export const cities = mysqlTable('cities', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  stateId: varchar('state_id', { length: 36 }).notNull(),

  latitude: decimal('latitude', { precision: 10, scale: 8 }),
  longitude: decimal('longitude', { precision: 11, scale: 8 }),

  isActive: boolean('is_active').notNull(),
  createdAt: datetime('created_at').notNull(),
  updatedAt: datetime('updated_at').notNull(),
});

/* ───────────── Categories ───────────── */

export const categories = mysqlTable('categories', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  code: varchar('code', { length: 50 }).notNull(),

  parentId: varchar('parent_id', { length: 36 }),
  description: varchar('description', { length: 1000 }),
  icon: varchar('icon', { length: 100 }),

  sortOrder: int('sort_order').notNull(),

  metadata: json('metadata').$type<Record<string, unknown> | null>(),

  isActive: boolean('is_active').notNull(),
  createdAt: datetime('created_at').notNull(),
  updatedAt: datetime('updated_at').notNull(),
});

/* ───────────── Tags ───────────── */

export const tags = mysqlTable('tags', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull(),
  color: varchar('color', { length: 20 }),

  isActive: boolean('is_active').notNull(),
  createdAt: datetime('created_at').notNull(),
  updatedAt: datetime('updated_at').notNull(),
});

/* ───────────── Document Types ───────────── */

export const documentTypes = mysqlTable('document_types', {
  id: varchar('id', { length: 36 }).primaryKey(),

  name: varchar('name', { length: 200 }).notNull(),
  code: varchar('code', { length: 50 }).notNull(),

  description: varchar('description', { length: 1000 }),

  allowedMimeTypes: json('allowed_mime_types').$type<string[]>().notNull(),

  maxSizeMb: int('max_size_mb').notNull(),
  isRequired: boolean('is_required').notNull(),

  isActive: boolean('is_active').notNull(),
  createdAt: datetime('created_at').notNull(),
  updatedAt: datetime('updated_at').notNull(),
});

/* ───────────── System Settings ───────────── */

export const systemSettings = mysqlTable('system_settings', {
  id: varchar('id', { length: 36 }).primaryKey(),
  key: varchar('key', { length: 200 }).notNull(),
  value: varchar('value', { length: 2000 }),

  type: varchar('type', { length: 50 }).notNull(),
  description: varchar('description', { length: 1000 }),
  category: varchar('category', { length: 100 }).notNull(),

  isPublic: boolean('is_public').notNull(),

  createdAt: datetime('created_at').notNull(),
  updatedAt: datetime('updated_at').notNull(),
});