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
  slug: 'admin' | 'lead' | 'user';
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
  lastName: string;
  phone?: string;
  avatar?: string;
  roleId: string;
  departmentId: string;
  designationId: string;
  status: 'active' | 'inactive' | 'suspended';
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  failedLoginAttempts: number;
  lockUntil?: Date;
  twoFactorSecret?: string;
  twoFactorEnabled: boolean;
  lastLoginAt?: Date;
  lastLoginIp?: string;
  createdBy?: string;
  updatedBy?: string;
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

  get designations(): Collection<MongoDesignation> {
    return this.db.collection<MongoDesignation>('designations');
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
      { key: { departmentId: 1 } },
      { key: { status: 1 } },
    ]);

    await this.roles.createIndexes([
      { key: { slug: 1 }, unique: true },
    ]);

    await this.departments.createIndexes([
      { key: { code: 1 }, unique: true },
    ]);

    await this.designations.createIndexes([
      { key: { code: 1 }, unique: true },
      { key: { departmentId: 1 } },
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
