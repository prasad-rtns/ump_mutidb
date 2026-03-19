import { v4 as uuidv4 } from 'uuid';
import type { ConnectionPool } from 'mssql';
import { ISessionDAL } from '../interfaces/session.dal.interface';
import { IRoleDAL, IDepartmentDAL, IDesignationDAL } from '../interfaces/role-dept-desig.dal.interface';
import { IRole, IDepartment, IDesignation, CreateRoleDTO, UpdateRoleDTO, CreateDepartmentDTO, UpdateDepartmentDTO, CreateDesignationDTO, UpdateDesignationDTO } from '../../modules/master/master.types';
import { ISession, CreateSessionDTO } from '../../modules/common/common.types';

// ─── Session DAL ──────────────────────────────────────────────────────────────
export class MssqlSessionDAL implements ISessionDAL {
  constructor(private readonly pool: ConnectionPool) {}

  async create(data: CreateSessionDTO): Promise<ISession> {
    const id = uuidv4();
    await this.pool.request()
      .input('id', id).input('userId', data.userId).input('refreshToken', data.refreshToken)
      .input('deviceInfo', data.deviceInfo ?? null).input('ipAddress', data.ipAddress ?? null)
      .input('userAgent', data.userAgent ?? null).input('expiresAt', data.expiresAt)
      .query(`INSERT INTO sessions (id, user_id, refresh_token, device_info, ip_address, user_agent, is_revoked, expires_at, created_at)
              VALUES (@id, @userId, @refreshToken, @deviceInfo, @ipAddress, @userAgent, 0, @expiresAt, GETUTCDATE())`);
    const r = await this.pool.request().input('id', id).query<ISession>('SELECT * FROM sessions WHERE id = @id');
    return r.recordset[0];
  }

  async findByRefreshToken(token: string): Promise<ISession | null> {
    const r = await this.pool.request().input('token', token)
      .query<ISession>('SELECT * FROM sessions WHERE refresh_token = @token AND is_revoked = 0');
    return r.recordset[0] ?? null;
  }

  async findActiveByUserId(userId: string): Promise<ISession[]> {
    const r = await this.pool.request().input('userId', userId)
      .query<ISession>('SELECT * FROM sessions WHERE user_id = @userId AND is_revoked = 0');
    return r.recordset;
  }

  async revokeByToken(token: string): Promise<void> {
    await this.pool.request().input('token', token)
      .query('UPDATE sessions SET is_revoked = 1 WHERE refresh_token = @token');
  }

  async revokeAllByUserId(userId: string): Promise<void> {
    await this.pool.request().input('userId', userId)
      .query('UPDATE sessions SET is_revoked = 1 WHERE user_id = @userId');
  }

  async deleteExpired(): Promise<number> {
    const r = await this.pool.request()
      .query('DELETE FROM sessions WHERE expires_at < GETUTCDATE()');
    return r.rowsAffected[0] ?? 0;
  }
}

// ─── Role DAL ─────────────────────────────────────────────────────────────────
export class MssqlRoleDAL implements IRoleDAL {
  constructor(private readonly pool: ConnectionPool) {}

  async findAll(activeOnly = true): Promise<IRole[]> {
    const where = activeOnly ? 'WHERE is_active = 1' : '';
    const r = await this.pool.request().query<IRole>(`SELECT * FROM roles ${where}`);
    return r.recordset;
  }

  async findById(id: string): Promise<IRole | null> {
    const r = await this.pool.request().input('id', id).query<IRole>('SELECT * FROM roles WHERE id = @id');
    return r.recordset[0] ?? null;
  }

  async findBySlug(slug: IRole['slug']): Promise<IRole | null> {
    const r = await this.pool.request().input('slug', slug).query<IRole>('SELECT * FROM roles WHERE slug = @slug');
    return r.recordset[0] ?? null;
  }

  async create(data: CreateRoleDTO): Promise<IRole> {
    const id = uuidv4();
    await this.pool.request()
      .input('id', id).input('name', data.name).input('slug', data.slug)
      .input('description', data.description ?? null)
      .input('permissions', JSON.stringify(data.permissions ?? []))
      .query(`INSERT INTO roles (id, name, slug, description, permissions, is_active, created_at, updated_at)
              VALUES (@id, @name, @slug, @description, @permissions, 1, GETUTCDATE(), GETUTCDATE())`);
    return (await this.findById(id))!;
  }

  async update(id: string, data: UpdateRoleDTO): Promise<IRole | null> {
    const sets: string[] = ['updated_at = GETUTCDATE()'];
    const req = this.pool.request().input('id', id);
    if (data.name        !== undefined) { req.input('name', data.name); sets.push('name = @name'); }
    if (data.description !== undefined) { req.input('desc', data.description); sets.push('description = @desc'); }
    if (data.permissions !== undefined) { req.input('perms', JSON.stringify(data.permissions)); sets.push('permissions = @perms'); }
    if (data.isActive    !== undefined) { req.input('active', data.isActive ? 1 : 0); sets.push('is_active = @active'); }
    await req.query(`UPDATE roles SET ${sets.join(', ')} WHERE id = @id`);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const r = await this.pool.request().input('id', id)
      .query('UPDATE roles SET is_active = 0, updated_at = GETUTCDATE() WHERE id = @id');
    return (r.rowsAffected[0] ?? 0) > 0;
  }
}

// ─── Department DAL ───────────────────────────────────────────────────────────
export class MssqlDepartmentDAL implements IDepartmentDAL {
  constructor(private readonly pool: ConnectionPool) {}

  async findAll(activeOnly = true): Promise<IDepartment[]> {
    const r = await this.pool.request().query<IDepartment>(`SELECT * FROM departments ${activeOnly ? 'WHERE is_active = 1' : ''}`);
    return r.recordset;
  }

  async findById(id: string): Promise<IDepartment | null> {
    const r = await this.pool.request().input('id', id).query<IDepartment>('SELECT * FROM departments WHERE id = @id');
    return r.recordset[0] ?? null;
  }

  async findByCode(code: string): Promise<IDepartment | null> {
    const r = await this.pool.request().input('code', code).query<IDepartment>('SELECT * FROM departments WHERE code = @code');
    return r.recordset[0] ?? null;
  }

  async findChildren(parentId: string): Promise<IDepartment[]> {
    const r = await this.pool.request().input('parentId', parentId)
      .query<IDepartment>('SELECT * FROM departments WHERE parent_id = @parentId');
    return r.recordset;
  }

  async create(data: CreateDepartmentDTO): Promise<IDepartment> {
    const id = uuidv4();
    await this.pool.request()
      .input('id', id).input('name', data.name).input('code', data.code)
      .input('parentId', data.parentId ?? null).input('managerId', data.managerId ?? null)
      .input('description', data.description ?? null)
      .query(`INSERT INTO departments (id, name, code, parent_id, manager_id, description, is_active, created_at, updated_at)
              VALUES (@id, @name, @code, @parentId, @managerId, @description, 1, GETUTCDATE(), GETUTCDATE())`);
    return (await this.findById(id))!;
  }

  async update(id: string, data: UpdateDepartmentDTO): Promise<IDepartment | null> {
    const sets: string[] = ['updated_at = GETUTCDATE()'];
    const req = this.pool.request().input('id', id);
    const fieldMap: Record<string, string> = { name: 'name', code: 'code', parentId: 'parent_id', managerId: 'manager_id', description: 'description' };
    for (const [key, col] of Object.entries(fieldMap)) {
      if (key in data) { req.input(key, (data as Record<string, unknown>)[key]); sets.push(`${col} = @${key}`); }
    }
    if (data.isActive !== undefined) { req.input('active', data.isActive ? 1 : 0); sets.push('is_active = @active'); }
    await req.query(`UPDATE departments SET ${sets.join(', ')} WHERE id = @id`);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const r = await this.pool.request().input('id', id)
      .query('UPDATE departments SET is_active = 0, updated_at = GETUTCDATE() WHERE id = @id');
    return (r.rowsAffected[0] ?? 0) > 0;
  }
}

// ─── Designation DAL ──────────────────────────────────────────────────────────
export class MssqlDesignationDAL implements IDesignationDAL {
  constructor(private readonly pool: ConnectionPool) {}

  async findAll(activeOnly = true): Promise<IDesignation[]> {
    const r = await this.pool.request().query<IDesignation>(`SELECT * FROM designations ${activeOnly ? 'WHERE is_active = 1' : ''}`);
    return r.recordset;
  }

  async findByDepartment(departmentId: string, activeOnly = true): Promise<IDesignation[]> {
    const where = activeOnly ? 'AND is_active = 1' : '';
    const r = await this.pool.request().input('deptId', departmentId)
      .query<IDesignation>(`SELECT * FROM designations WHERE department_id = @deptId ${where}`);
    return r.recordset;
  }

  async findById(id: string): Promise<IDesignation | null> {
    const r = await this.pool.request().input('id', id).query<IDesignation>('SELECT * FROM designations WHERE id = @id');
    return r.recordset[0] ?? null;
  }

  async findByCode(code: string): Promise<IDesignation | null> {
    const r = await this.pool.request().input('code', code).query<IDesignation>('SELECT * FROM designations WHERE code = @code');
    return r.recordset[0] ?? null;
  }

  async create(data: CreateDesignationDTO): Promise<IDesignation> {
    const id = uuidv4();
    await this.pool.request()
      .input('id', id).input('name', data.name).input('code', data.code)
      .input('deptId', data.departmentId).input('level', data.level ?? 1)
      .input('description', data.description ?? null)
      .query(`INSERT INTO designations (id, name, code, department_id, level, description, is_active, created_at, updated_at)
              VALUES (@id, @name, @code, @deptId, @level, @description, 1, GETUTCDATE(), GETUTCDATE())`);
    return (await this.findById(id))!;
  }

  async update(id: string, data: UpdateDesignationDTO): Promise<IDesignation | null> {
    const sets: string[] = ['updated_at = GETUTCDATE()'];
    const req = this.pool.request().input('id', id);
    const fieldMap: Record<string, string> = { name: 'name', code: 'code', departmentId: 'department_id', level: 'level', description: 'description' };
    for (const [key, col] of Object.entries(fieldMap)) {
      if (key in data) { req.input(key, (data as Record<string, unknown>)[key]); sets.push(`${col} = @${key}`); }
    }
    if (data.isActive !== undefined) { req.input('active', data.isActive ? 1 : 0); sets.push('is_active = @active'); }
    await req.query(`UPDATE designations SET ${sets.join(', ')} WHERE id = @id`);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const r = await this.pool.request().input('id', id)
      .query('UPDATE designations SET is_active = 0, updated_at = GETUTCDATE() WHERE id = @id');
    return (r.rowsAffected[0] ?? 0) > 0;
  }
}
