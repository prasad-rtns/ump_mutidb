import type { IUser } 
  from '../user/user.types';
export interface RegisterInput {
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
  userCategory?: IUser['userCategory'];
}

export interface LoginInput {
  identifier: string; // email or username
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
  user: Omit<IUser, 'password' | 'emailVerificationToken' | 'passwordResetToken' | 'twoFactorSecret'>;
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}
