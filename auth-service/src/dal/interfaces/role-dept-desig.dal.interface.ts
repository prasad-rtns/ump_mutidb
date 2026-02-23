import { Role, Department, Designation, CreateRoleDTO, UpdateRoleDTO, CreateDepartmentDTO, UpdateDepartmentDTO, CreateDesignationDTO, UpdateDesignationDTO } from '../../types';

// ─── Role ─────────────────────────────────────────────────────────────────────
export interface IRoleDAL {
  findAll(activeOnly?: boolean): Promise<Role[]>;
  findById(id: string): Promise<Role | null>;
  findBySlug(slug: Role['slug']): Promise<Role | null>;
  create(data: CreateRoleDTO): Promise<Role>;
  update(id: string, data: UpdateRoleDTO): Promise<Role | null>;
  delete(id: string): Promise<boolean>;
}

// ─── Department ───────────────────────────────────────────────────────────────
export interface IDepartmentDAL {
  findAll(activeOnly?: boolean): Promise<Department[]>;
  findById(id: string): Promise<Department | null>;
  findByCode(code: string): Promise<Department | null>;
  findChildren(parentId: string): Promise<Department[]>;
  create(data: CreateDepartmentDTO): Promise<Department>;
  update(id: string, data: UpdateDepartmentDTO): Promise<Department | null>;
  delete(id: string): Promise<boolean>;
}

// ─── Designation ──────────────────────────────────────────────────────────────
export interface IDesignationDAL {
  findAll(activeOnly?: boolean): Promise<Designation[]>;
  findByDepartment(departmentId: string, activeOnly?: boolean): Promise<Designation[]>;
  findById(id: string): Promise<Designation | null>;
  findByCode(code: string): Promise<Designation | null>;
  create(data: CreateDesignationDTO): Promise<Designation>;
  update(id: string, data: UpdateDesignationDTO): Promise<Designation | null>;
  delete(id: string): Promise<boolean>;
}
