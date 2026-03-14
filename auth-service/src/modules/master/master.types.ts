export type UserRoleSlug  = 'admin' | 'lead' | 'user';

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
