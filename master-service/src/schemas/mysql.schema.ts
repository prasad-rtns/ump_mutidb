import {
  mysqlTable,
  varchar,
  boolean,
  int,
  json,
  decimal,
  text,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/mysql-core';

export const countries = mysqlTable('countries', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  code: varchar('code', { length: 3 }).notNull(),
  dialCode: varchar('dial_code', { length: 10 }),
  flag: varchar('flag', { length: 10 }),
  currency: varchar('currency', { length: 10 }),
  currencySymbol: varchar('currency_symbol', { length: 10 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  codeIdx: uniqueIndex('countries_code_idx').on(table.code),
}));

export const states = mysqlTable('states', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  code: varchar('code', { length: 10 }).notNull(),
  countryId: varchar('country_id', { length: 36 }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  countryIdx: index('states_country_idx').on(table.countryId),
}));

export const cities = mysqlTable('cities', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  stateId: varchar('state_id', { length: 36 }).notNull(),
  latitude: decimal('latitude', { precision: 10, scale: 8 }),
  longitude: decimal('longitude', { precision: 11, scale: 8 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  stateIdx: index('cities_state_idx').on(table.stateId),
}));

export const categories = mysqlTable('categories', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  code: varchar('code', { length: 50 }).notNull(),
  categoryType: varchar('category_type', { length: 50 }).default('admin category').notNull(),
  description: text('description'),
  icon: varchar('icon', { length: 100 }),
  sortOrder: int('sort_order').default(0).notNull(),
  metadata: json('metadata').$type<Record<string, unknown> | null>(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  codeIdx: uniqueIndex('categories_code_idx').on(table.code),
}));

export const tags = mysqlTable('tags', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull(),
  color: varchar('color', { length: 20 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  nameIdx: uniqueIndex('tags_name_idx').on(table.name),
  slugIdx: uniqueIndex('tags_slug_idx').on(table.slug),
}));

export const documentTypes = mysqlTable('document_types', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  code: varchar('code', { length: 50 }).notNull(),
  description: text('description'),
  allowedMimeTypes: json('allowed_mime_types').$type<string[]>().default([]).notNull(),
  maxSizeMb: int('max_size_mb').default(10).notNull(),
  isRequired: boolean('is_required').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  codeIdx: uniqueIndex('doc_types_code_idx').on(table.code),
}));

export const systemSettings = mysqlTable('system_settings', {
  id: varchar('id', { length: 36 }).primaryKey(),
  key: varchar('key', { length: 200 }).notNull(),
  value: text('value'),
  type: varchar('type', { length: 50 }).default('string').notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }).default('general').notNull(),
  isPublic: boolean('is_public').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  keyIdx: uniqueIndex('settings_key_idx').on(table.key),
}));

export const notificationTemplates = mysqlTable('notification_templates', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  code: varchar('code', { length: 100 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  subject: varchar('subject', { length: 500 }),
  body: text('body').notNull(),
  variables: json('variables').$type<string[]>().default([]).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  codeIdx: uniqueIndex('notif_tmpl_code_idx').on(table.code),
}));

export const serviceTypes = mysqlTable('service_types', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  code: varchar('code', { length: 50 }).notNull(),
  description: text('description'),
  routeLink: varchar('route_link', { length: 500 }),
  icon: varchar('icon', { length: 100 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  codeIdx: uniqueIndex('service_types_code_idx').on(table.code),
}));

export const mysqlSchema = {
  countries,
  states,
  cities,
  categories,
  tags,
  documentTypes,
  systemSettings,
  notificationTemplates,
  serviceTypes,
};
