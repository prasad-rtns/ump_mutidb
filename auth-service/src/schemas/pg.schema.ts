import {
  pgTable, uuid, varchar, text, boolean, integer, timestamp, jsonb, pgEnum, index, uniqueIndex
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─── Enums ────────────────────────────────────────────────────────────────────
export const userStatusEnum = pgEnum('user_status', ['active', 'inactive', 'suspended']);
export const userRoleEnum = pgEnum('user_role_slug', ['admin', 'lead', 'user']);
export const userCategoryEnum = pgEnum('user_category', ['external', 'internal', 'admin']);
export const companyUtilityTypeEnum = pgEnum('company_utility_type', ['company', 'utility']);
export const moduleTypeEnum = pgEnum('module_type', ['admin', 'internal', 'external']);

// ─── Roles table ──────────────────────────────────────────────────────────────
export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  description: text('description'),
  permissions: jsonb('permissions').$type<Record<string, string[]>>().default({}),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  slugIdx: uniqueIndex('roles_slug_idx').on(table.slug),
}));

// â”€â”€â”€ Company / Utilities table â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const companies = pgTable('company_or_utilities', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 200 }).notNull(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  type: companyUtilityTypeEnum('type').default('company').notNull(),
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  codeIdx: uniqueIndex('company_or_utilities_code_idx').on(table.code),
}));

// ─── Departments table ────────────────────────────────────────────────────────
export const departments = pgTable('departments', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 200 }).notNull(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  parentId: uuid('parent_id'),
  managerId: uuid('manager_id'),
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  codeIdx: uniqueIndex('departments_code_idx').on(table.code),
  parentIdx: index('departments_parent_idx').on(table.parentId),
}));

// ─── Designations table ───────────────────────────────────────────────────────
export const designations = pgTable('designations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 200 }).notNull(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  departmentId: uuid('department_id').notNull().references(() => departments.id),
  level: integer('level').default(1).notNull(),
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  deptIdx: index('designations_dept_idx').on(table.departmentId),
  codeIdx: uniqueIndex('designations_code_idx').on(table.code),
}));

// ─── Users table ──────────────────────────────────────────────────────────────
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: varchar('username', { length: 100 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  middleName: varchar('middle_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  avatar: text('avatar'),
  roleId: uuid('role_id').notNull().references(() => roles.id),
  companyId: uuid('company_id').references(() => companies.id),
  departmentId: uuid('department_id').notNull().references(() => departments.id),
  designationId: uuid('designation_id').notNull().references(() => designations.id),
  userCategory: userCategoryEnum('user_category').default('internal').notNull(),
  status: userStatusEnum('status').default('active').notNull(),
  isEmailVerified: boolean('is_email_verified').default(false).notNull(),
  emailVerificationToken: text('email_verification_token'),
  passwordResetToken: text('password_reset_token'),
  passwordResetExpires: timestamp('password_reset_expires'),
  failedLoginAttempts: integer('failed_login_attempts').default(0).notNull(),
  lockUntil: timestamp('lock_until'),
  twoFactorSecret: text('two_factor_secret'),
  twoFactorEnabled: boolean('two_factor_enabled').default(false).notNull(),
  lastLoginAt: timestamp('last_login_at'),
  lastLoginIp: varchar('last_login_ip', { length: 45 }),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  emailIdx: uniqueIndex('users_email_idx').on(table.email),
  usernameIdx: uniqueIndex('users_username_idx').on(table.username),
  roleIdx: index('users_role_idx').on(table.roleId),
  companyIdx: index('users_company_idx').on(table.companyId),
  deptIdx: index('users_dept_idx').on(table.departmentId),
  statusIdx: index('users_status_idx').on(table.status),
}));

// â”€â”€â”€ Module menus table â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const moduleMenus = pgTable('module_menus', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 150 }).notNull(),
  code: varchar('code', { length: 100 }).notNull().unique(),
  route: varchar('route', { length: 300 }),
  icon: varchar('icon', { length: 100 }),
  parentId: uuid('parent_id'),
  moduleType: moduleTypeEnum('module_type').default('admin').notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  permissions: jsonb('permissions').$type<string[]>().default([]),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  codeIdx: uniqueIndex('module_menus_code_idx').on(table.code),
  parentIdx: index('module_menus_parent_idx').on(table.parentId),
}));

// ─── Sessions table ───────────────────────────────────────────────────────────
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  refreshToken: text('refresh_token').notNull().unique(),
  deviceInfo: text('device_info'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  isRevoked: boolean('is_revoked').default(false).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('sessions_user_idx').on(table.userId),
  tokenIdx: uniqueIndex('sessions_token_idx').on(table.refreshToken),
}));

// ─── Audit Logs table ─────────────────────────────────────────────────────────
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id'),
  action: varchar('action', { length: 100 }).notNull(),
  entity: varchar('entity', { length: 100 }).notNull(),
  entityId: uuid('entity_id'),
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('audit_user_idx').on(table.userId),
  entityIdx: index('audit_entity_idx').on(table.entity, table.entityId),
  createdAtIdx: index('audit_created_idx').on(table.createdAt),
}));

// ─── Relations ────────────────────────────────────────────────────────────────
export const usersRelations = relations(users, ({ one, many }) => ({
  role: one(roles, { fields: [users.roleId], references: [roles.id] }),
  company: one(companies, { fields: [users.companyId], references: [companies.id] }),
  department: one(departments, { fields: [users.departmentId], references: [departments.id] }),
  designation: one(designations, { fields: [users.designationId], references: [designations.id] }),
  sessions: many(sessions),
}));

export const companiesRelations = relations(companies, ({ many }) => ({
  users: many(users),
}));

export const departmentsRelations = relations(departments, ({ one, many }) => ({
  parent: one(departments, { fields: [departments.parentId], references: [departments.id] }),
  designations: many(designations),
  users: many(users),
}));

export const designationsRelations = relations(designations, ({ one }) => ({
  department: one(departments, { fields: [designations.departmentId], references: [departments.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

// ─── Export all schema ────────────────────────────────────────────────────────
export const pgSchema = {
  roles,
  companies,
  departments,
  designations,
  users,
  moduleMenus,
  sessions,
  auditLogs,
};
