/**
 * MongoDB Collections Schema for auth-service
 * Since Drizzle ORM doesn't fully support MongoDB, we use native MongoDB driver
 * with typed interfaces that mirror the Drizzle relational schemas
 */
import { Db, Collection, ObjectId } from 'mongodb';

// ─── MongoDB Document Interfaces ──────────────────────────────────────────────
export interface MongoRole {
  _id?: ObjectId;
  id: string;
  name: string;
  slug: string;
  description?: string;
  permissions: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MongoDepartment {
  _id?: ObjectId;
  id: string;
  name: string;
  code: string;
  parentId?: string;
  managerId?: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MongoCompanyOrUtility {
  _id?: ObjectId;
  id: string;
  name: string;
  code: string;
  type: 'company' | 'utility';
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MongoDesignation {
  _id?: ObjectId;
  id: string;
  name: string;
  code: string;
  departmentId: string;
  level: number;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MongoUser {
  _id?: ObjectId;
  id: string;
  username: string;
  email: string;
  password: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  phone?: string | null;
  avatar?: string | null;
  roleId: string;
  companyId?: string | null;
  departmentId: string;
  designationId: string;
  userCategory: 'external' | 'internal' | 'admin';
  status: 'active' | 'inactive' | 'suspended';
  isEmailVerified: boolean;
  emailVerificationToken?: string | null;
  passwordResetToken?: string | null;
  passwordResetExpires?: Date | null;
  failedLoginAttempts: number;
  lockUntil?: Date | null;
  twoFactorSecret?: string | null;
  twoFactorEnabled: boolean;
  lastLoginAt?: Date | null;
  lastLoginIp?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MongoModuleMenu {
  _id?: ObjectId;
  id: string;
  name: string;
  code: string;
  route?: string;
  icon?: string;
  parentId?: string;
  moduleType: 'admin' | 'internal' | 'external';
  sortOrder: number;
  permissions: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MongoSession {
  _id?: ObjectId;
  id: string;
  userId: string;
  refreshToken: string;
  deviceInfo?: string;
  ipAddress?: string;
  userAgent?: string;
  isRevoked: boolean;
  expiresAt: Date;
  createdAt: Date;
}

export interface MongoAuditLog {
  _id?: ObjectId;
  id: string;
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

// ─── Collection accessor ──────────────────────────────────────────────────────
export class MongoCollections {
  constructor(private db: Db) {}

  get roles(): Collection<MongoRole> {
    return this.db.collection<MongoRole>('roles');
  }

  get departments(): Collection<MongoDepartment> {
    return this.db.collection<MongoDepartment>('departments');
  }

  get companies(): Collection<MongoCompanyOrUtility> {
    return this.db.collection<MongoCompanyOrUtility>('company_or_utilities');
  }

  get designations(): Collection<MongoDesignation> {
    return this.db.collection<MongoDesignation>('designations');
  }

  get moduleMenus(): Collection<MongoModuleMenu> {
    return this.db.collection<MongoModuleMenu>('module_menus');
  }

  get users(): Collection<MongoUser> {
    return this.db.collection<MongoUser>('users');
  }

  get sessions(): Collection<MongoSession> {
    return this.db.collection<MongoSession>('sessions');
  }

  get auditLogs(): Collection<MongoAuditLog> {
    return this.db.collection<MongoAuditLog>('audit_logs');
  }

  // ─── Create indexes ──────────────────────────────────────────────────────────
  async createIndexes(): Promise<void> {
    await this.users.createIndexes([
      { key: { email: 1 }, unique: true },
      { key: { username: 1 }, unique: true },
      { key: { roleId: 1 } },
      { key: { companyId: 1 } },
      { key: { departmentId: 1 } },
      { key: { userCategory: 1 } },
      { key: { status: 1 } },
    ]);

    await this.roles.createIndexes([
      { key: { slug: 1 }, unique: true },
    ]);

    await this.departments.createIndexes([
      { key: { code: 1 }, unique: true },
    ]);

    await this.companies.createIndexes([
      { key: { code: 1 }, unique: true },
      { key: { type: 1 } },
      { key: { isActive: 1 } },
    ]);

    await this.designations.createIndexes([
      { key: { code: 1 }, unique: true },
      { key: { departmentId: 1 } },
    ]);

    await this.moduleMenus.createIndexes([
      { key: { code: 1 }, unique: true },
      { key: { parentId: 1 } },
      { key: { moduleType: 1 } },
      { key: { isActive: 1 } },
    ]);

    await this.sessions.createIndexes([
      { key: { userId: 1 } },
      { key: { refreshToken: 1 }, unique: true },
      { key: { expiresAt: 1 }, expireAfterSeconds: 0 }, // TTL index
    ]);

    await this.auditLogs.createIndexes([
      { key: { userId: 1 } },
      { key: { entity: 1, entityId: 1 } },
      { key: { createdAt: -1 } },
    ]);
  }
}
