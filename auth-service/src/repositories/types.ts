export interface IUser {
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
  department?: IDepartment;
  designation?: IDesignation;
}

export interface IRole {
  id: string;
  name: string;
  slug: 'admin' | 'lead' | 'user';
  description?: string | null;
  permissions: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDepartment {
  id: string;
  name: string;
  code: string;
  parentId?: string | null;
  managerId?: string | null;
  description?: string | null;
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
  description?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISession {
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
  identifier: string; // email or username
  password: string;
  deviceInfo?: string;
  twoFactorCode?: string;
}

export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  roleId?: string;
  departmentId?: string;
  designationId?: string;
  status?: 'active' | 'inactive' | 'suspended';
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
