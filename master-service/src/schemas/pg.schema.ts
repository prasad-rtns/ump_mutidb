import {
  pgTable, uuid, varchar, text, boolean, integer, timestamp, jsonb, decimal, index, uniqueIndex
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─── Countries ────────────────────────────────────────────────────────────────
export const countries = pgTable('countries', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  code: varchar('code', { length: 3 }).notNull().unique(),
  dialCode: varchar('dial_code', { length: 10 }),
  flag: varchar('flag', { length: 10 }),
  currency: varchar('currency', { length: 10 }),
  currencySymbol: varchar('currency_symbol', { length: 10 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({ codeIdx: uniqueIndex('countries_code_idx').on(t.code) }));

// ─── States ───────────────────────────────────────────────────────────────────
export const states = pgTable('states', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  code: varchar('code', { length: 10 }).notNull(),
  countryId: uuid('country_id').notNull().references(() => countries.id),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({ countryIdx: index('states_country_idx').on(t.countryId) }));

// ─── Cities ───────────────────────────────────────────────────────────────────
export const cities = pgTable('cities', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  stateId: uuid('state_id').notNull().references(() => states.id),
  latitude: decimal('latitude', { precision: 10, scale: 8 }),
  longitude: decimal('longitude', { precision: 11, scale: 8 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({ stateIdx: index('cities_state_idx').on(t.stateId) }));

// ─── Categories ───────────────────────────────────────────────────────────────
export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 200 }).notNull(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  parentId: uuid('parent_id'),
  description: text('description'),
  icon: varchar('icon', { length: 100 }),
  sortOrder: integer('sort_order').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  codeIdx: uniqueIndex('categories_code_idx').on(t.code),
  parentIdx: index('categories_parent_idx').on(t.parentId),
}));

// ─── Tags ─────────────────────────────────────────────────────────────────────
export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  color: varchar('color', { length: 20 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Document Types ───────────────────────────────────────────────────────────
export const documentTypes = pgTable('document_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 200 }).notNull(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  description: text('description'),
  allowedMimeTypes: jsonb('allowed_mime_types').$type<string[]>().default([]),
  maxSizeMb: integer('max_size_mb').default(10).notNull(),
  isRequired: boolean('is_required').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({ codeIdx: uniqueIndex('doc_types_code_idx').on(t.code) }));

// ─── System Settings ──────────────────────────────────────────────────────────
export const systemSettings = pgTable('system_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: varchar('key', { length: 200 }).notNull().unique(),
  value: text('value'),
  type: varchar('type', { length: 50 }).default('string').notNull(),
  description: text('description'),
  isPublic: boolean('is_public').default(false).notNull(),
  category: varchar('category', { length: 100 }).default('general').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({ keyIdx: uniqueIndex('settings_key_idx').on(t.key) }));

// ─── Notifications Templates ───────────────────────────────────────────────────
export const notificationTemplates = pgTable('notification_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 200 }).notNull(),
  code: varchar('code', { length: 100 }).notNull().unique(),
  type: varchar('type', { length: 50 }).notNull(), // email, sms, push
  subject: varchar('subject', { length: 500 }),
  body: text('body').notNull(),
  variables: jsonb('variables').$type<string[]>().default([]),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({ codeIdx: uniqueIndex('notif_tmpl_code_idx').on(t.code) }));

// ─── Service Types ────────────────────────────────────────────────────────────
export const serviceTypes = pgTable('service_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 200 }).notNull(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  description: text('description'),
  routeLink: varchar('route_link', { length: 500 }),
  icon: varchar('icon', { length: 100 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({ codeIdx: uniqueIndex('service_types_code_idx').on(t.code) }));

// ─── Relations ────────────────────────────────────────────────────────────────
export const countriesRelations = relations(countries, ({ many }) => ({
  states: many(states),
}));

export const statesRelations = relations(states, ({ one, many }) => ({
  country: one(countries, { fields: [states.countryId], references: [countries.id] }),
  cities: many(cities),
}));

export const citiesRelations = relations(cities, ({ one }) => ({
  state: one(states, { fields: [cities.stateId], references: [states.id] }),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, { fields: [categories.parentId], references: [categories.id] }),
  children: many(categories),
}));

export const masterSchema = {
  countries, states, cities, categories, tags,
  documentTypes, systemSettings, notificationTemplates, serviceTypes,
};
