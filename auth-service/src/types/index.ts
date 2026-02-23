// ─────────────────────────────────────────────────────────────────────────────
//  Domain entities
// ─────────────────────────────────────────────────────────────────────────────

export type UserStatus    = 'active' | 'inactive' | 'suspended';
export type UserRoleSlug  = 'admin' | 'lead' | 'user';

export interface Role {
  id: string;
  name: string;
  slug: UserRoleSlug;
  description: string | null;
  permissions: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  parentId: string | null;
  managerId: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Designation {
  id: string;
  name: string;
  code: string;
  departmentId: string;
  level: number;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  avatar: string | null;
  roleId: string;
  departmentId: string;
  designationId: string;
  status: UserStatus;
  isEmailVerified: boolean;
  emailVerificationToken?: string | null;
  passwordResetToken: string | null;
  passwordResetExpires: Date | null;
  failedLoginAttempts: number;
  lockUntil?: Date | null;
  twoFactorSecret: string | null;
  twoFactorEnabled: boolean;
  lastLoginAt: Date | null;
  lastLoginIp: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  // joined
  role?: Role;
  department?: Department;
  designation?: Designation;
}

export interface Session {
  id: string;
  userId: string;
  refreshToken: string;
  deviceInfo: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  isRevoked: boolean;
  expiresAt: Date;
  createdAt: Date;
}

export interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
//  DTO types (input shapes from controllers → services)
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateUserDTO {
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
  createdBy?: string;
}

export interface UpdateUserDTO {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  roleId?: string;
  departmentId?: string;
  designationId?: string;
  status?: UserStatus;
  password?: string;
  isEmailVerified?: boolean;
  emailVerificationToken?: string | null;
  passwordResetToken?: string | null;
  passwordResetExpires?: Date | null;
  failedLoginAttempts?: number;
  lockUntil?: Date | null;
  lastLoginAt?: Date | null;
  lastLoginIp?: string | null;
  updatedBy?: string;
}

export interface CreateRoleDTO {
  name: string;
  slug: UserRoleSlug;
  description?: string;
  permissions?: string[];
}

export interface UpdateRoleDTO {
  name?: string;
  description?: string;
  permissions?: string[];
  isActive?: boolean;
}

export interface CreateDepartmentDTO {
  name: string;
  code: string;
  parentId?: string;
  managerId?: string;
  description?: string;
}

export interface UpdateDepartmentDTO {
  name?: string;
  code?: string;
  parentId?: string;
  managerId?: string;
  description?: string;
  isActive?: boolean;
}

export interface CreateDesignationDTO {
  name: string;
  code: string;
  departmentId: string;
  level?: number;
  description?: string;
}

export interface UpdateDesignationDTO {
  name?: string;
  code?: string;
  departmentId?: string;
  level?: number;
  description?: string;
  isActive?: boolean;
}

export interface CreateSessionDTO {
  userId: string;
  refreshToken: string;
  deviceInfo?: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Query filter types
// ─────────────────────────────────────────────────────────────────────────────

export interface UserFilter {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: UserStatus;
  departmentId?: string;
  roleId?: string;
  // scope injected by middleware
  departmentFilter?: string;
  userFilter?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Service input types (higher-level than DTOs)
// ─────────────────────────────────────────────────────────────────────────────

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roleId: string;
  departmentId: string;
  designationId: string;
}

export interface LoginInput {
  identifier: string;
  password: string;
  deviceInfo?: string;
  twoFactorCode?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface LoginResult {
  user: Omit<User, 'password' | 'emailVerificationToken' | 'passwordResetToken' | 'twoFactorSecret'>;
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}
