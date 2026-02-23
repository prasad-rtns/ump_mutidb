// ─── User & Auth Types ────────────────────────────────────────────────────────
export type UserRole = 'admin' | 'lead' | 'user';
export type UserStatus = 'active' | 'inactive' | 'suspended';
export type DatabaseType = 'postgres' | 'mysql' | 'mssql' | 'oracle' | 'mongodb';
export type ServiceName = 'auth-service' | 'master-service' | 'document-service';

export interface IUser {
  id: string;
  username: string;
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roleId: string;
  departmentId: string;
  designationId: string;
  status: UserStatus;
  isEmailVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface IRole {
  id: string;
  name: string;
  slug: UserRole;
  description?: string;
  permissions: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDepartment {
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

export interface IDesignation {
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

export interface ISession {
  userId: string;
  token: string;
  refreshToken: string;
  deviceInfo?: string;
  ipAddress?: string;
  expiresAt: Date;
  createdAt: Date;
}

// ─── Document Types ───────────────────────────────────────────────────────────
export type DocumentStatus = 'pending' | 'approved' | 'rejected' | 'archived';
export type StorageProvider = 's3' | 'cloudinary' | 'azure_blob' | 'local';

export interface IDocument {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  key: string;
  provider: StorageProvider;
  uploadedBy: string;
  entityType?: string;
  entityId?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  status: DocumentStatus;
  createdAt: Date;
  updatedAt: Date;
}

// ─── API Response Types ───────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: PaginationMeta;
  errors?: ValidationError[];
  timestamp: string;
  requestId?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: UserStatus;
  departmentId?: string;
  roleId?: string;
}

// ─── JWT Payload ──────────────────────────────────────────────────────────────
export interface JwtPayload {
  sub: string;        // user id
  username: string;
  email: string;
  role: UserRole;
  roleId: string;
  departmentId: string;
  designationId: string;
  sessionId: string;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  sub: string;
  sessionId: string;
  type: 'refresh';
  iat?: number;
  exp?: number;
}

// ─── Master Data Types ────────────────────────────────────────────────────────
export interface ICountry {
  id: string;
  name: string;
  code: string;
  dialCode: string;
  flag?: string;
  isActive: boolean;
}

export interface IState {
  id: string;
  name: string;
  code: string;
  countryId: string;
  isActive: boolean;
}

export interface ICity {
  id: string;
  name: string;
  stateId: string;
  isActive: boolean;
}

export interface ICategory {
  id: string;
  name: string;
  code: string;
  parentId?: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Database Config ──────────────────────────────────────────────────────────
export interface DatabaseConfig {
  type: DatabaseType;
  host?: string;
  port?: number;
  database: string;
  username?: string;
  password?: string;
  url?: string;
  ssl?: boolean;
  poolMin?: number;
  poolMax?: number;
}

// ─── Audit Log ────────────────────────────────────────────────────────────────
export interface IAuditLog {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

// ─── Express augmentation ─────────────────────────────────────────────────────
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      requestId?: string;
      dbType?: DatabaseType;
    }
  }
}
