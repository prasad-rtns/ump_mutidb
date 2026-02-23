import { v4 as uuidv4 } from 'uuid';
import type { Pool as OraPool, Result as OraResult } from 'oracledb';
import { IUserDAL } from '../interfaces/user.dal.interface';
import { User, CreateUserDTO, UpdateUserDTO, UserFilter } from '../../types';
import { PaginatedResult } from '@prasad-rtns/shared';

/**
 * OracleUserDAL — Oracle DB implementation of IUserDAL.
 * Uses named bind parameters (:name) which Oracle requires.
 * Retrieves and releases connections from the pool on every call.
 */
export class OracleUserDAL implements IUserDAL {
  constructor(private readonly pool: OraPool) {}

  private async exec<T = Record<string, unknown>>(
    sql: string,
    binds: Record<string, unknown> = {},
    opts: Record<string, unknown> = {}
  ): Promise<OraResult<T>> {
    const conn = await this.pool.getConnection();
    try {
      return await conn.execute<T>(sql, binds as any, { outFormat: 2, ...opts }) as OraResult<T>;
    } finally {
      await conn.close();
    }
  }

  async findById(id: string): Promise<User | null> {
    const r = await this.exec<Record<string, unknown>>(
      `SELECT * FROM users WHERE id = :id`, { id }
    );
    return r.rows?.[0] ? this._map(r.rows[0]) : null;
  }

  async findByIdWithRelations(id: string): Promise<User | null> {
    const r = await this.exec<Record<string, unknown>>(`
      SELECT u.*,
             r.id AS role_id, r.name AS role_name, r.slug AS role_slug,
             d.id AS dept_id, d.name AS dept_name,
             de.id AS desig_id, de.name AS desig_name
      FROM   users u
      LEFT JOIN roles        r  ON r.id  = u.role_id
      LEFT JOIN departments  d  ON d.id  = u.department_id
      LEFT JOIN designations de ON de.id = u.designation_id
      WHERE u.id = :id`, { id }
    );
    return r.rows?.[0] ? this._map(r.rows[0], true) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const r = await this.exec<Record<string, unknown>>(
      'SELECT * FROM users WHERE email = :email', { email: email.toLowerCase() }
    );
    return r.rows?.[0] ? this._map(r.rows[0]) : null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const r = await this.exec<Record<string, unknown>>(
      'SELECT * FROM users WHERE username = :username', { username }
    );
    return r.rows?.[0] ? this._map(r.rows[0]) : null;
  }

  async findByEmailOrUsername(identifier: string): Promise<User | null> {
    const r = await this.exec<Record<string, unknown>>(
      'SELECT * FROM users WHERE email = :email OR username = :username',
      { email: identifier.toLowerCase(), username: identifier }
    );
    return r.rows?.[0] ? this._map(r.rows[0]) : null;
  }

  async findAll(opts: UserFilter): Promise<PaginatedResult<User>> {
    return this.findFiltered(opts);
  }

  async findFiltered(filter: UserFilter): Promise<PaginatedResult<User>> {
    const { page = 1, limit = 10, search, sortBy = 'created_at', sortOrder = 'DESC',
      status, departmentId, roleId, departmentFilter, userFilter } = filter;

    const offset   = (page - 1) * limit;
    const binds: Record<string, unknown> = { limit, offset };
    const conditions: string[] = [];

    if (userFilter)                                          { binds.userId = userFilter; conditions.push('u.id = :userId'); }
    else if (departmentFilter && departmentFilter !== 'all') { binds.deptFilter = departmentFilter; conditions.push('u.department_id = :deptFilter'); }
    if (status)       { binds.status = status;         conditions.push('u.status = :status'); }
    if (departmentId) { binds.deptId = departmentId;   conditions.push('u.department_id = :deptId'); }
    if (roleId)       { binds.roleId = roleId;          conditions.push('u.role_id = :roleId'); }
    if (search)       { binds.search = `%${search}%`;  conditions.push('(u.first_name LIKE :search OR u.last_name LIKE :search OR u.email LIKE :search OR u.username LIKE :search)'); }

    const where    = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderCol = sortBy === 'email' ? 'u.email' : sortBy === 'firstName' ? 'u.first_name' : 'u.created_at';
    const orderDir = sortOrder === 'asc' ? 'ASC' : 'DESC';

    // Oracle 12c+ supports OFFSET/FETCH syntax
    const dataSql = `
      SELECT u.*,
             r.slug AS role_slug, r.name AS role_name,
             d.name AS dept_name,
             de.name AS desig_name
      FROM   users u
      LEFT JOIN roles        r  ON r.id  = u.role_id
      LEFT JOIN departments  d  ON d.id  = u.department_id
      LEFT JOIN designations de ON de.id = u.designation_id
      ${where}
      ORDER BY ${orderCol} ${orderDir}
      OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
    `;
    const countSql = `SELECT COUNT(*) AS total FROM users u ${where}`;

    const [data, count] = await Promise.all([
      this.exec<Record<string, unknown>>(dataSql, binds),
      this.exec<{ TOTAL: number }>(countSql, { ...binds, limit: undefined, offset: undefined }),
    ]);

    return {
      data:  (data.rows ?? []).map(r => this._map(r, true)),
      total: count.rows?.[0]?.TOTAL ?? 0,
    };
  }

  async create(data: CreateUserDTO): Promise<User> {
    const id  = uuidv4();
    await this.exec(`
      INSERT INTO users (id, username, email, password, first_name, last_name, phone, avatar,
                         role_id, department_id, designation_id, status, is_email_verified,
                         failed_login_attempts, two_factor_enabled, created_by, created_at, updated_at)
      VALUES (:id, :username, :email, :password, :firstName, :lastName, :phone, :avatar,
              :roleId, :deptId, :desigId, 'active', 0, 0, 0, :createdBy, SYSDATE, SYSDATE)`,
      {
        id, username: data.username, email: data.email.toLowerCase(), password: data.password,
        firstName: data.firstName, lastName: data.lastName, phone: data.phone ?? null, avatar: data.avatar ?? null,
        roleId: data.roleId, deptId: data.departmentId, desigId: data.designationId, createdBy: data.createdBy ?? null,
      }
    );
    return (await this.findById(id))!;
  }

  async update(id: string, data: UpdateUserDTO): Promise<User | null> {
    const binds: Record<string, unknown> = { id };
    const sets: string[] = ['updated_at = SYSDATE'];
    const fieldMap: Record<string, string> = {
      firstName: 'first_name', lastName: 'last_name', phone: 'phone', avatar: 'avatar',
      roleId: 'role_id', departmentId: 'department_id', designationId: 'designation_id',
      status: 'status', password: 'password', failedLoginAttempts: 'failed_login_attempts',
      lockUntil: 'lock_until', lastLoginAt: 'last_login_at', lastLoginIp: 'last_login_ip', updatedBy: 'updated_by',
    };
    for (const [key, col] of Object.entries(fieldMap)) {
      if (key in data && (data as Record<string, unknown>)[key] !== undefined) {
        binds[key] = (data as Record<string, unknown>)[key];
        sets.push(`${col} = :${key}`);
      }
    }
    if (sets.length === 1) return this.findById(id);
    await this.exec(`UPDATE users SET ${sets.join(', ')} WHERE id = :id`, binds);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const r = await this.exec('DELETE FROM users WHERE id = :id', { id });
    return (r.rowsAffected ?? 0) > 0;
  }

  async incrementFailedLogins(id: string): Promise<number> {
    const conn = await this.pool.getConnection();
    try {
      await conn.execute(
        'UPDATE users SET failed_login_attempts = failed_login_attempts + 1, updated_at = SYSDATE WHERE id = :id',
        { id }
      );
      const r = await conn.execute<{ FAILED_LOGIN_ATTEMPTS: number }>(
        'SELECT failed_login_attempts FROM users WHERE id = :id', { id }, { outFormat: 2 }
      );
      await conn.commit();
      return r.rows?.[0]?.FAILED_LOGIN_ATTEMPTS ?? 0;
    } finally {
      await conn.close();
    }
  }

  async resetFailedLogins(id: string): Promise<void> {
    await this.exec('UPDATE users SET failed_login_attempts = 0, lock_until = NULL, updated_at = SYSDATE WHERE id = :id', { id });
  }

  async lockAccount(id: string, until: Date): Promise<void> {
    await this.exec('UPDATE users SET lock_until = :until, updated_at = SYSDATE WHERE id = :id', { id, until });
  }

  async updateLastLogin(id: string, ip: string): Promise<void> {
    await this.exec('UPDATE users SET last_login_at = SYSDATE, last_login_ip = :ip, updated_at = SYSDATE WHERE id = :id', { id, ip });
  }

  async changeStatus(id: string, status: User['status'], updatedBy: string): Promise<boolean> {
    const r = await this.exec(
      'UPDATE users SET status = :status, updated_by = :updatedBy, updated_at = SYSDATE WHERE id = :id',
      { id, status, updatedBy }
    );
    return (r.rowsAffected ?? 0) > 0;
  }

  async softDelete(id: string, deletedBy: string): Promise<boolean> {
    return this.changeStatus(id, 'inactive', deletedBy);
  }

  async countByFilter(filter: Partial<UserFilter>): Promise<number> {
    const binds: Record<string, unknown> = {};
    const conditions: string[] = [];
    if (filter.userFilter)                                               { binds.userId = filter.userFilter; conditions.push('id = :userId'); }
    else if (filter.departmentFilter && filter.departmentFilter !== 'all') { binds.deptFilter = filter.departmentFilter; conditions.push('department_id = :deptFilter'); }
    if (filter.status)       { binds.status = filter.status;      conditions.push('status = :status'); }
    if (filter.departmentId) { binds.deptId = filter.departmentId;conditions.push('department_id = :deptId'); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const r = await this.exec<{ TOTAL: number }>(`SELECT COUNT(*) AS total FROM users ${where}`, binds);
    return r.rows?.[0]?.TOTAL ?? 0;
  }

  // ─── Map Oracle row (all-caps keys) to camelCase User ────────────────────────
  private _map(row: Record<string, unknown>, withRelations = false): User {
    const g = (k: string) => row[k] ?? row[k.toUpperCase()] ?? row[k.toLowerCase()];
    return {
      id:                     g('id') as string,
      username:               g('username') as string,
      email:                  g('email') as string,
      password:               g('password') as string,
      firstName:              g('first_name') as string,
      lastName:               g('last_name') as string,
      phone:                  (g('phone') ?? null) as string | null,
      avatar:                 (g('avatar') ?? null) as string | null,
      roleId:                 g('role_id') as string,
      departmentId:           g('department_id') as string,
      designationId:          g('designation_id') as string,
      status:                 g('status') as User['status'],
      isEmailVerified:        Boolean(g('is_email_verified')),
      emailVerificationToken: (g('email_verification_token') ?? null) as string | null,
      passwordResetToken:     (g('password_reset_token') ?? null) as string | null,
      passwordResetExpires:   (g('password_reset_expires') ?? null) as Date | null,
      failedLoginAttempts:    Number(g('failed_login_attempts') ?? 0),
      lockUntil:              (g('lock_until') ?? null) as Date | null,
      twoFactorSecret:        (g('two_factor_secret') ?? null) as string | null,
      twoFactorEnabled:       Boolean(g('two_factor_enabled')),
      lastLoginAt:            (g('last_login_at') ?? null) as Date | null,
      lastLoginIp:            (g('last_login_ip') ?? null) as string | null,
      createdBy:              (g('created_by') ?? null) as string | null,
      updatedBy:              (g('updated_by') ?? null) as string | null,
      createdAt:              g('created_at') as Date,
      updatedAt:              g('updated_at') as Date,
      ...(withRelations && g('role_slug') ? {
        role: { id: g('role_id'), slug: g('role_slug'), name: g('role_name'), permissions: [] } as unknown as User['role'],
      } : {}),
      ...(withRelations && g('dept_name') ? {
        department: { id: g('dept_id'), name: g('dept_name') } as unknown as User['department'],
      } : {}),
      ...(withRelations && g('desig_name') ? {
        designation: { id: g('desig_id'), name: g('desig_name') } as unknown as User['designation'],
      } : {}),
    };
  }
}
