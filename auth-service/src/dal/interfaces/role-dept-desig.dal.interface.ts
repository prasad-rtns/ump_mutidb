import { IRole, IDepartment, IDesignation, CreateRoleDTO, UpdateRoleDTO, CreateDepartmentDTO, UpdateDepartmentDTO, CreateDesignationDTO, UpdateDesignationDTO } from '../../modules/master/master.types';

// ─── Role ─────────────────────────────────────────────────────────────────────
export interface IRoleDAL {
  findAll(activeOnly?: boolean): Promise<IRole[]>;
  findById(id: string): Promise<IRole | null>;
  findBySlug(slug: IRole['slug']): Promise<IRole | null>;
  create(data: CreateRoleDTO): Promise<IRole>;
  update(id: string, data: UpdateRoleDTO): Promise<IRole | null>;
  delete(id: string): Promise<boolean>;
}

// ─── Department ───────────────────────────────────────────────────────────────
export interface IDepartmentDAL {
  findAll(activeOnly?: boolean): Promise<IDepartment[]>;
  findById(id: string): Promise<IDepartment | null>;
  findByCode(code: string): Promise<IDepartment | null>;
  findChildren(parentId: string): Promise<IDepartment[]>;
  create(data: CreateDepartmentDTO): Promise<IDepartment>;
  update(id: string, data: UpdateDepartmentDTO): Promise<IDepartment | null>;
  delete(id: string): Promise<boolean>;
}

// ─── Designation ──────────────────────────────────────────────────────────────
export interface IDesignationDAL {
  findAll(activeOnly?: boolean): Promise<IDesignation[]>;
  findByDepartment(departmentId: string, activeOnly?: boolean): Promise<IDesignation[]>;
  findById(id: string): Promise<IDesignation | null>;
  findByCode(code: string): Promise<IDesignation | null>;
  create(data: CreateDesignationDTO): Promise<IDesignation>;
  update(id: string, data: UpdateDesignationDTO): Promise<IDesignation | null>;
  delete(id: string): Promise<boolean>;
}
