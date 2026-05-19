import {
  mysqlTable, varchar, text, boolean, int, timestamp, json, mysqlEnum, index, uniqueIndex
} from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

export const roles = mysqlTable('roles', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: mysqlEnum('slug', ['admin', 'lead', 'user']).notNull().unique(),
  description: text('description'),
  permissions: json('permissions').$type<string[]>().default([]),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export const departments = mysqlTable('departments', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  parentId: varchar('parent_id', { length: 36 }),
  managerId: varchar('manager_id', { length: 36 }),
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export const designations = mysqlTable('designations', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  departmentId: varchar('department_id', { length: 36 }).notNull(),
  level: int('level').default(1).notNull(),
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
}, (t) => ({
  deptIdx: index('designations_dept_idx').on(t.departmentId),
}));

export const users = mysqlTable('users', {
  id: varchar('id', { length: 36 }).primaryKey(),
  username: varchar('username', { length: 100 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  middleName: varchar('middle_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  avatar: text('avatar'),
  roleId: varchar('role_id', { length: 36 }).notNull(),
  departmentId: varchar('department_id', { length: 36 }).notNull(),
  designationId: varchar('designation_id', { length: 36 }).notNull(),
  userCategory: mysqlEnum('user_category', ['external', 'internal', 'admin']).default('internal').notNull(),
  status: mysqlEnum('status', ['active', 'inactive', 'suspended']).default('active').notNull(),
  isEmailVerified: boolean('is_email_verified').default(false).notNull(),
  emailVerificationToken: text('email_verification_token'),
  passwordResetToken: text('password_reset_token'),
  passwordResetExpires: timestamp('password_reset_expires'),
  failedLoginAttempts: int('failed_login_attempts').default(0).notNull(),
  lockUntil: timestamp('lock_until'),
  twoFactorSecret: text('two_factor_secret'),
  twoFactorEnabled: boolean('two_factor_enabled').default(false).notNull(),
  lastLoginAt: timestamp('last_login_at'),
  lastLoginIp: varchar('last_login_ip', { length: 45 }),
  createdBy: varchar('created_by', { length: 36 }),
  updatedBy: varchar('updated_by', { length: 36 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
}, (t) => ({
  emailIdx: uniqueIndex('users_email_idx').on(t.email),
  usernameIdx: uniqueIndex('users_username_idx').on(t.username),
  roleIdx: index('users_role_idx').on(t.roleId),
  deptIdx: index('users_dept_idx').on(t.departmentId),
  statusIdx: index('users_status_idx').on(t.status),
}));

export const sessions = mysqlTable('sessions', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  refreshToken: text('refresh_token').notNull(),
  deviceInfo: text('device_info'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  isRevoked: boolean('is_revoked').default(false).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  userIdx: index('sessions_user_idx').on(t.userId),
}));

export const auditLogs = mysqlTable('audit_logs', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }),
  action: varchar('action', { length: 100 }).notNull(),
  entity: varchar('entity', { length: 100 }).notNull(),
  entityId: varchar('entity_id', { length: 36 }),
  oldValues: json('old_values').$type<Record<string, unknown> | null>(),
  newValues: json('new_values').$type<Record<string, unknown> | null>(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  userIdx: index('audit_user_idx').on(t.userId),
  entityIdx: index('audit_entity_idx').on(t.entity, t.entityId),
  createdAtIdx: index('audit_created_idx').on(t.createdAt),
}));

export const mysqlSchema = { roles, departments, designations, users, sessions, auditLogs };
