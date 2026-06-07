export type UserRoleSlug  = string;
export type ModuleType = 'admin' | 'internal' | 'external';

export interface IRole {
  id: string;
  name: string;
  slug: UserRoleSlug;
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

export interface ICompanyOrUtility {
  id: string;
  name: string;
  code: string;
  type: 'company' | 'utility';
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

export interface IModuleMenu {
  id: string;
  name: string;
  code: string;
  route: string;
  icon?: string | null;
  parentId?: string | null;
  moduleType: ModuleType;
  sortOrder: number;
  permissions: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
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

export interface CreateCompanyOrUtilityDTO {
  name: string;
  code: string;
  type?: 'company' | 'utility';
  description?: string;
}

export interface UpdateCompanyOrUtilityDTO {
  name?: string;
  code?: string;
  type?: 'company' | 'utility';
  description?: string;
  isActive?: boolean;
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

export interface CreateModuleMenuDTO {
  name: string;
  code: string;
  route: string;
  icon?: string;
  parentId?: string | null;
  moduleType?: ModuleType;
  sortOrder?: number;
  permissions?: string[];
}

export interface UpdateModuleMenuDTO {
  name?: string;
  code?: string;
  route?: string;
  icon?: string | null;
  parentId?: string | null;
  moduleType?: ModuleType;
  sortOrder?: number;
  permissions?: string[];
  isActive?: boolean;
}
