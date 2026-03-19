import { v4 as uuidv4 } from 'uuid';
import type { Pool as OraPool } from 'oracledb';
import { ISessionDAL } from '../interfaces/session.dal.interface';
import { IRoleDAL, IDepartmentDAL, IDesignationDAL } from '../interfaces/role-dept-desig.dal.interface';
import { IRole, IDepartment, IDesignation, CreateRoleDTO, UpdateRoleDTO, CreateDepartmentDTO, UpdateDepartmentDTO, CreateDesignationDTO, UpdateDesignationDTO } from '../../modules/master/master.types';
import { ISession, CreateSessionDTO } from '../../modules/common/common.types';


const FMT = 2; // OUT_FORMAT_OBJECT

// ─── Session DAL ──────────────────────────────────────────────────────────────
export class OracleSessionDAL implements ISessionDAL {
  constructor(private readonly pool: OraPool) {}

  private async q<T>(sql: string, binds: Record<string, unknown> = {}) {
    const c = await this.pool.getConnection();
    try { return await c.execute<T>(sql, binds as any, { outFormat: FMT }); }
    finally { await c.close(); }
  }

  async create(data: CreateSessionDTO): Promise<ISession> {
    const id = uuidv4();
    await this.q(`INSERT INTO sessions (id, user_id, refresh_token, device_info, ip_address, user_agent, is_revoked, expires_at, created_at)
                  VALUES (:id, :userId, :refreshToken, :deviceInfo, :ipAddress, :userAgent, 0, :expiresAt, SYSDATE)`,
      { id, userId: data.userId, refreshToken: data.refreshToken, deviceInfo: data.deviceInfo ?? null,
        ipAddress: data.ipAddress ?? null, userAgent: data.userAgent ?? null, expiresAt: data.expiresAt });
    const r = await this.q<Record<string, unknown>>('SELECT * FROM sessions WHERE id = :id', { id });
    return this._mapSession(r.rows![0]);
  }

  async findByRefreshToken(token: string): Promise<ISession | null> {
    const r = await this.q<Record<string, unknown>>('SELECT * FROM sessions WHERE refresh_token = :token AND is_revoked = 0', { token });
    return r.rows?.[0] ? this._mapSession(r.rows[0]) : null;
  }

  async findActiveByUserId(userId: string): Promise<ISession[]> {
    const r = await this.q<Record<string, unknown>>('SELECT * FROM sessions WHERE user_id = :userId AND is_revoked = 0', { userId });
    return (r.rows ?? []).map(r => this._mapSession(r));
  }

  async revokeByToken(token: string): Promise<void> {
    await this.q('UPDATE sessions SET is_revoked = 1 WHERE refresh_token = :token', { token });
  }

  async revokeAllByUserId(userId: string): Promise<void> {
    await this.q('UPDATE sessions SET is_revoked = 1 WHERE user_id = :userId', { userId });
  }

  async deleteExpired(): Promise<number> {
    const r = await this.q('DELETE FROM sessions WHERE expires_at < SYSDATE');
    return r.rowsAffected ?? 0;
  }

  private _mapSession(row: Record<string, unknown>): ISession {
    const g = (k: string) => row[k] ?? row[k.toUpperCase()];
    return {
      id:           g('id') as string,
      userId:       g('user_id') as string,
      refreshToken: g('refresh_token') as string,
      deviceInfo:   (g('device_info') ?? null) as string | null,
      ipAddress:    (g('ip_address') ?? null) as string | null,
      userAgent:    (g('user_agent') ?? null) as string | null,
      isRevoked:    Boolean(g('is_revoked')),
      expiresAt:    g('expires_at') as Date,
      createdAt:    g('created_at') as Date,
    };
  }
}


// ─── Role DAL ─────────────────────────────────────────────────────────────────
export class OracleRoleDAL implements IRoleDAL {
  constructor(private readonly pool: OraPool) {}

  private async q<T>(sql: string, binds: Record<string, unknown> = {}) {
    const c = await this.pool.getConnection();
    try { return await c.execute<T>(sql, binds as any, { outFormat: FMT }); }
    finally { await c.close(); }
  }

  async findAll(activeOnly = true): Promise<IRole[]> {
    const r = await this.q<Record<string, unknown>>(`SELECT * FROM roles ${activeOnly ? 'WHERE is_active = 1' : ''}`);
    return (r.rows ?? []).map(this._mapRole);
  }

  async findById(id: string): Promise<IRole | null> {
    const r = await this.q<Record<string, unknown>>('SELECT * FROM roles WHERE id = :id', { id });
    return r.rows?.[0] ? this._mapRole(r.rows[0]) : null;
  }

  async findBySlug(slug: IRole['slug']): Promise<IRole | null> {
    const r = await this.q<Record<string, unknown>>('SELECT * FROM roles WHERE slug = :slug', { slug });
    return r.rows?.[0] ? this._mapRole(r.rows[0]) : null;
  }

  async create(data: CreateRoleDTO): Promise<IRole> {
    const id = uuidv4();
    await this.q(`INSERT INTO roles (id, name, slug, description, permissions, is_active, created_at, updated_at)
                  VALUES (:id, :name, :slug, :description, :permissions, 1, SYSDATE, SYSDATE)`,
      { id, name: data.name, slug: data.slug, description: data.description ?? null, permissions: JSON.stringify(data.permissions ?? []) });
    return (await this.findById(id))!;
  }

  async update(id: string, data: UpdateRoleDTO): Promise<IRole | null> {
    const sets: string[] = ['updated_at = SYSDATE'];
    const binds: Record<string, unknown> = { id };
    if (data.name        !== undefined) { binds.name = data.name; sets.push('name = :name'); }
    if (data.description !== undefined) { binds.desc = data.description; sets.push('description = :desc'); }
    if (data.permissions !== undefined) { binds.perms = JSON.stringify(data.permissions); sets.push('permissions = :perms'); }
    if (data.isActive    !== undefined) { binds.active = data.isActive ? 1 : 0; sets.push('is_active = :active'); }
    await this.q(`UPDATE roles SET ${sets.join(', ')} WHERE id = :id`, binds);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const r = await this.q('UPDATE roles SET is_active = 0, updated_at = SYSDATE WHERE id = :id', { id });
    return (r.rowsAffected ?? 0) > 0;
  }

  private _mapRole(row: Record<string, unknown>): IRole {
    const g = (k: string) => row[k] ?? row[k.toUpperCase()];
    let permissions: string[] = [];
    try { permissions = JSON.parse(g('permissions') as string ?? '[]'); } catch { /* ignore */ }
    return {
      id: g('id') as string, name: g('name') as string, slug: g('slug') as IRole['slug'],
      description: (g('description') ?? null) as string | null, permissions,
      isActive: Boolean(g('is_active')), createdAt: g('created_at') as Date, updatedAt: g('updated_at') as Date,
    };
  }
}

// ─── Department DAL ───────────────────────────────────────────────────────────
export class OracleDepartmentDAL implements IDepartmentDAL {
  constructor(private readonly pool: OraPool) {}

  private async q<T>(sql: string, binds: Record<string, unknown> = {}) {
    const c = await this.pool.getConnection();
    try { return await c.execute<T>(sql, binds as any, { outFormat: FMT }); }
    finally { await c.close(); }
  }

  async findAll(activeOnly = true): Promise<IDepartment[]> {
    const r = await this.q<Record<string, unknown>>(`SELECT * FROM departments ${activeOnly ? 'WHERE is_active = 1' : ''}`);
    return (r.rows ?? []).map(row => this._map(row));
  }

  async findById(id: string): Promise<IDepartment | null> {
    const r = await this.q<Record<string, unknown>>('SELECT * FROM departments WHERE id = :id', { id });
    return r.rows?.[0] ? this._map(r.rows[0]) : null;
  }

  async findByCode(code: string): Promise<IDepartment | null> {
    const r = await this.q<Record<string, unknown>>('SELECT * FROM departments WHERE code = :code', { code });
    return r.rows?.[0] ? this._map(r.rows[0]) : null;
  }

  async findChildren(parentId: string): Promise<IDepartment[]> {
    const r = await this.q<Record<string, unknown>>('SELECT * FROM departments WHERE parent_id = :parentId', { parentId });
    return (r.rows ?? []).map(row => this._map(row));
  }

  async create(data: CreateDepartmentDTO): Promise<IDepartment> {
    const id = uuidv4();
    await this.q(`INSERT INTO departments (id, name, code, parent_id, manager_id, description, is_active, created_at, updated_at)
                  VALUES (:id, :name, :code, :parentId, :managerId, :description, 1, SYSDATE, SYSDATE)`,
      { id, name: data.name, code: data.code, parentId: data.parentId ?? null, managerId: data.managerId ?? null, description: data.description ?? null });
    return (await this.findById(id))!;
  }

  async update(id: string, data: UpdateDepartmentDTO): Promise<IDepartment | null> {
    const sets: string[] = ['updated_at = SYSDATE'];
    const binds: Record<string, unknown> = { id };
    const fm: Record<string, string> = { name: 'name', code: 'code', parentId: 'parent_id', managerId: 'manager_id', description: 'description' };
    for (const [k, col] of Object.entries(fm)) {
      if (k in data) { binds[k] = (data as Record<string, unknown>)[k]; sets.push(`${col} = :${k}`); }
    }
    if (data.isActive !== undefined) { binds.active = data.isActive ? 1 : 0; sets.push('is_active = :active'); }
    await this.q(`UPDATE departments SET ${sets.join(', ')} WHERE id = :id`, binds);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const r = await this.q('UPDATE departments SET is_active = 0, updated_at = SYSDATE WHERE id = :id', { id });
    return (r.rowsAffected ?? 0) > 0;
  }

  private _map(row: Record<string, unknown>): IDepartment {
    const g = (k: string) => row[k] ?? row[k.toUpperCase()];
    return {
      id: g('id') as string, name: g('name') as string, code: g('code') as string,
      parentId: (g('parent_id') ?? null) as string | null, managerId: (g('manager_id') ?? null) as string | null,
      description: (g('description') ?? null) as string | null, isActive: Boolean(g('is_active')),
      createdAt: g('created_at') as Date, updatedAt: g('updated_at') as Date,
    };
  }
}

// ─── Designation DAL ──────────────────────────────────────────────────────────
export class OracleDesignationDAL implements IDesignationDAL {
  constructor(private readonly pool: OraPool) {}

  private async q<T>(sql: string, binds: Record<string, unknown> = {}) {
    const c = await this.pool.getConnection();
    try { return await c.execute<T>(sql, binds as any, { outFormat: FMT }); }
    finally { await c.close(); }
  }

  async findAll(activeOnly = true): Promise<IDesignation[]> {
    const r = await this.q<Record<string, unknown>>(`SELECT * FROM designations ${activeOnly ? 'WHERE is_active = 1' : ''}`);
    return (r.rows ?? []).map(row => this._map(row));
  }

  async findByDepartment(departmentId: string, activeOnly = true): Promise<IDesignation[]> {
    const r = await this.q<Record<string, unknown>>(
      `SELECT * FROM designations WHERE department_id = :deptId ${activeOnly ? 'AND is_active = 1' : ''}`,
      { deptId: departmentId }
    );
    return (r.rows ?? []).map(row => this._map(row));
  }

  async findById(id: string): Promise<IDesignation | null> {
    const r = await this.q<Record<string, unknown>>('SELECT * FROM designations WHERE id = :id', { id });
    return r.rows?.[0] ? this._map(r.rows[0]) : null;
  }

  async findByCode(code: string): Promise<IDesignation | null> {
    const r = await this.q<Record<string, unknown>>('SELECT * FROM designations WHERE code = :code', { code });
    return r.rows?.[0] ? this._map(r.rows[0]) : null;
  }

  async create(data: CreateDesignationDTO): Promise<IDesignation> {
    const id = uuidv4();
    await this.q(`INSERT INTO designations (id, name, code, department_id, level, description, is_active, created_at, updated_at)
                  VALUES (:id, :name, :code, :deptId, :level, :description, 1, SYSDATE, SYSDATE)`,
      { id, name: data.name, code: data.code, deptId: data.departmentId, level: data.level ?? 1, description: data.description ?? null });
    return (await this.findById(id))!;
  }

  async update(id: string, data: UpdateDesignationDTO): Promise<IDesignation | null> {
    const sets: string[] = ['updated_at = SYSDATE'];
    const binds: Record<string, unknown> = { id };
    const fm: Record<string, string> = { name: 'name', code: 'code', departmentId: 'department_id', level: 'level', description: 'description' };
    for (const [k, col] of Object.entries(fm)) {
      if (k in data) { binds[k] = (data as Record<string, unknown>)[k]; sets.push(`${col} = :${k}`); }
    }
    if (data.isActive !== undefined) { binds.active = data.isActive ? 1 : 0; sets.push('is_active = :active'); }
    await this.q(`UPDATE designations SET ${sets.join(', ')} WHERE id = :id`, binds);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const r = await this.q('UPDATE designations SET is_active = 0, updated_at = SYSDATE WHERE id = :id', { id });
    return (r.rowsAffected ?? 0) > 0;
  }

  private _map(row: Record<string, unknown>): IDesignation {
    const g = (k: string) => row[k] ?? row[k.toUpperCase()];
    return {
      id: g('id') as string, name: g('name') as string, code: g('code') as string,
      departmentId: g('department_id') as string, level: Number(g('level') ?? 1),
      description: (g('description') ?? null) as string | null, isActive: Boolean(g('is_active')),
      createdAt: g('created_at') as Date, updatedAt: g('updated_at') as Date,
    };
  }
}
