// src/modules/department/department.types.ts

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
  parentId?: string | null;
  managerId?: string | null;
  description?: string;
  isActive?: boolean;
}