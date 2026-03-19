import { DALFactory }           from '../../dal/dal.factory';
import { CacheService }          from '@prasad-rtns/shared';
import { DatabaseType }          from '@prasad-rtns/shared';
import { CreateRoleDTO, UpdateRoleDTO, CreateDepartmentDTO, UpdateDepartmentDTO, CreateDesignationDTO, UpdateDesignationDTO } from './master.types';
import logger                    from '../../database/logger';

const cache = new CacheService('master-auth');

// ─────────────────────────────────────────────────────────────────────────────
//  RoleService
// ─────────────────────────────────────────────────────────────────────────────
export class RoleService {
  private constructor(private readonly dal: Awaited<ReturnType<typeof DALFactory.get>>) {}

  static async create(dbType: DatabaseType) {
    return new RoleService(await DALFactory.get(dbType));
  }

  async listRoles(activeOnly = true) {
    const key    = `roles:${activeOnly}`;
    const cached = await cache.get<unknown[]>(key);
    if (cached) return cached;
    const data = await this.dal.role.findAll(activeOnly);
    await cache.set(key, data, 3600);
    return data;
  }

  async getById(id: string) {
    const role = await this.dal.role.findById(id);
    if (!role) throw new Error('Role not found');
    return role;
  }

  async createRole(data: CreateRoleDTO) {
    const existing = await this.dal.role.findBySlug(data.slug);
    if (existing) throw new Error(`Role with slug '${data.slug}' already exists`);
    const role = await this.dal.role.create(data);
    await cache.del('roles:true'); await cache.del('roles:false');
    logger.info('Role created', { roleId: role.id, slug: role.slug });
    return role;
  }

  async updateRole(id: string, data: UpdateRoleDTO) {
    const role = await this.dal.role.update(id, data);
    if (!role) throw new Error('Role not found');
    await cache.del('roles:true'); await cache.del('roles:false');
    return role;
  }

  async deleteRole(id: string) {
    const ok = await this.dal.role.delete(id);
    if (!ok) throw new Error('Role not found or already inactive');
    await cache.del('roles:true');
    return { message: 'Role deactivated' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  DepartmentService
// ─────────────────────────────────────────────────────────────────────────────
export class DepartmentService {
  private constructor(private readonly dal: Awaited<ReturnType<typeof DALFactory.get>>) {}

  static async create(dbType: DatabaseType) {
    return new DepartmentService(await DALFactory.get(dbType));
  }

  async listDepartments(activeOnly = true) {
    const key    = `departments:${activeOnly}`;
    const cached = await cache.get<unknown[]>(key);
    if (cached) return cached;
    const data = await this.dal.department.findAll(activeOnly);
    await cache.set(key, data, 3600);
    return data;
  }

  async getById(id: string) {
    const dept = await this.dal.department.findById(id);
    if (!dept) throw new Error('Department not found');
    const children = await this.dal.department.findChildren(id);
    return { ...dept, children };
  }

  async createDepartment(data: CreateDepartmentDTO) {
    const existing = await this.dal.department.findByCode(data.code);
    if (existing) throw new Error(`Department code '${data.code}' already exists`);
    const dept = await this.dal.department.create(data);
    await cache.del('departments:true'); await cache.del('departments:false');
    logger.info('Department created', { deptId: dept.id });
    return dept;
  }

  async updateDepartment(id: string, data: UpdateDepartmentDTO) {
    const dept = await this.dal.department.update(id, data);
    if (!dept) throw new Error('Department not found');
    await cache.del('departments:true'); await cache.del('departments:false');
    return dept;
  }

  async deleteDepartment(id: string) {
    const ok = await this.dal.department.delete(id);
    if (!ok) throw new Error('Department not found or already inactive');
    await cache.del('departments:true');
    return { message: 'Department deactivated' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  DesignationService
// ─────────────────────────────────────────────────────────────────────────────
export class DesignationService {
  private constructor(private readonly dal: Awaited<ReturnType<typeof DALFactory.get>>) {}

  static async create(dbType: DatabaseType) {
    return new DesignationService(await DALFactory.get(dbType));
  }

  async listDesignations(activeOnly = true, departmentId?: string) {
    const key    = `designations:${departmentId ?? 'all'}:${activeOnly}`;
    const cached = await cache.get<unknown[]>(key);
    if (cached) return cached;
    const data = departmentId
      ? await this.dal.designation.findByDepartment(departmentId, activeOnly)
      : await this.dal.designation.findAll(activeOnly);
    await cache.set(key, data, 3600);
    return data;
  }

  async getById(id: string) {
    const desig = await this.dal.designation.findById(id);
    if (!desig) throw new Error('Designation not found');
    return desig;
  }

  async createDesignation(data: CreateDesignationDTO) {
    const existing = await this.dal.designation.findByCode(data.code);
    if (existing) throw new Error(`Designation code '${data.code}' already exists`);
    const desig = await this.dal.designation.create(data);
    await cache.delPattern('designations:*');
    logger.info('Designation created', { desigId: desig.id });
    return desig;
  }

  async updateDesignation(id: string, data: UpdateDesignationDTO) {
    const desig = await this.dal.designation.update(id, data);
    if (!desig) throw new Error('Designation not found');
    await cache.delPattern('designations:*');
    return desig;
  }

  async deleteDesignation(id: string) {
    const ok = await this.dal.designation.delete(id);
    if (!ok) throw new Error('Designation not found or already inactive');
    await cache.delPattern('designations:*');
    return { message: 'Designation deactivated' };
  }
}
