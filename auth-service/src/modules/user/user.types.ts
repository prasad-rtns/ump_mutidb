// ─────────────────────────────────────────────────────────────────────────────
//  Domain entities
// ─────────────────────────────────────────────────────────────────────────────
export type UserStatus    = 'active' | 'inactive' | 'suspended';
export type UserRoleSlug  = 'admin' | 'lead' | 'user';
export type UserCategory  = 'external' | 'internal' | 'admin';
import type { IRole, IDepartment, IDesignation, ICompanyOrUtility }
  from '../master/master.types';

export interface IUser {
  id: string;
  username: string;
  email: string;
  password: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  phone: string | null;
  avatar: string | null;
  roleId: string;
  companyId?: string | null;
  departmentId: string;
  designationId: string;
  userCategory: UserCategory;
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
  role?: IRole;
  company?: ICompanyOrUtility;
  department?: IDepartment;
  designation?: IDesignation;
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
  companyId?: string | null;
  departmentId: string;
  designationId: string;
  userCategory?: UserCategory;
  isEmailVerified?: boolean;
  twoFactorEnabled?: boolean;
  createdBy?: string;
}

export interface UpdateUserDTO {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  roleId?: string;
  companyId?: string | null;
  departmentId?: string;
  designationId?: string;
  status?: UserStatus;
  password?: string;
  isEmailVerified?: boolean;
  twoFactorEnabled?: boolean;
  emailVerificationToken?: string | null;
  passwordResetToken?: string | null;
  passwordResetExpires?: Date | null;
  failedLoginAttempts?: number;
  lockUntil?: Date | null;
  lastLoginAt?: Date | null;
  lastLoginIp?: string | null;
  updatedBy?: string;
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
  companyId?: string;
  userCategory?: UserCategory;
  // scope injected by middleware
  departmentFilter?: string;
  userFilter?: string;
}

export interface UpdateUserInput {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  roleId?: string;
  companyId?: string | null;
  departmentId?: string;
  designationId?: string;
  status?: 'active' | 'inactive' | 'suspended';
}
