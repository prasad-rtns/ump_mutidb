// ─── Auth ──────────────────────────────────────────────────────────────────────
export type UserCategory = 'external' | 'internal' | 'admin';
export type UserStatus   = 'active' | 'inactive' | 'suspended';
export type ModuleType   = 'admin' | 'internal' | 'external';

export interface IUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  phone?: string | null;
  avatar?: string | null;
  roleId: string;
  companyId?: string | null;
  departmentId: string;
  designationId: string;
  userCategory: UserCategory;
  status: UserStatus;
  isEmailVerified: boolean;
  failedLoginAttempts?: number;
  lockUntil?: string | null;
  twoFactorEnabled?: boolean;
  lastLoginAt?: string | null;
  lastLoginIp?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt: string;
  role?: IRole;
  company?: ICompanyOrUtility;
  department?: IDepartment;
  designation?: IDesignation;
}

export interface IRole {
  id: string;
  name: string;
  slug: string;
  description?: string;
  permissions: string[] | Record<string, string[]>;
  isActive: boolean;
}

export interface ICompanyOrUtility {
  id: string;
  name: string;
  code: string;
  type: 'company' | 'utility';
  description?: string | null;
  isActive: boolean;
}

export interface IDepartment {
  id: string;
  name: string;
  code: string;
  parentId?: string | null;
  isActive: boolean;
}

export interface IDesignation {
  id: string;
  name: string;
  code: string;
  departmentId: string;
  level: number;
  isActive: boolean;
}

export interface LoginResult {
  user: IUser;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// ─── Master ────────────────────────────────────────────────────────────────────
export interface ICountry    { id: string; name: string; code: string; dialCode?: string | null; flag?: string | null; currency?: string | null; currencySymbol?: string | null; isActive: boolean; }
export interface IState      { id: string; name: string; code: string; countryId: string; isActive: boolean; }
export interface ICity       { id: string; name: string; stateId: string; latitude?: string | null; longitude?: string | null; isActive: boolean; }
export interface ICategory   { id: string; name: string; code: string; categoryType?: string; description?: string | null; icon?: string | null; sortOrder: number; isActive: boolean; }
export interface ITag        { id: string; name: string; slug: string; color?: string | null; isActive: boolean; }
export interface IDocumentType { id: string; name: string; code: string; description?: string | null; maxSizeMb: number; isRequired: boolean; isActive: boolean; }
export interface IServiceType  { id: string; name: string; code: string; description?: string | null; routeLink?: string | null; icon?: string | null; isActive: boolean; }
export interface ISystemSetting { id: string; key: string; value?: string | null; type: string; description?: string | null; isPublic: boolean; category: string; }
export interface IModuleMenu { id: string; name: string; code: string; route: string; icon?: string | null; parentId?: string | null; moduleType?: ModuleType; sortOrder: number; permissions: string[]; isActive: boolean; }

// ─── API Response wrapper ──────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: { total?: number; page?: number; limit?: number };
}

export interface PaginatedData<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// ─── Schema Metadata (from /api/v1/meta/schema) ───────────────────────────────
export type FieldType = 'text' | 'textarea' | 'number' | 'boolean' | 'select' | 'email' | 'url' | 'color';

export interface FieldMeta {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  readOnly?: boolean;
  hidden?: boolean;
  maxLength?: number;
  default?: unknown;
  options?: { value: string; label: string }[];
  placeholder?: string;
}

export interface EntityMeta {
  label: string;
  pluralLabel: string;
  icon: string;
  apiEndpoint: string;
  idField: string;
  listColumns: string[];
  searchable: boolean;
  fields: FieldMeta[];
  permissions: { create: string[]; update: string[]; delete: string[] };
}

export type SchemaCatalogue = Record<string, EntityMeta>;
