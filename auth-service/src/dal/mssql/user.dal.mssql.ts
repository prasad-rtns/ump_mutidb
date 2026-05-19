import { v4 as uuidv4 } from 'uuid';
import type { ConnectionPool, IResult } from 'mssql';
import { IUserDAL } from '../interfaces/user.dal.interface';
import { IUser, CreateUserDTO, UpdateUserDTO, UserFilter } from '../../modules/user/user.types';
import { PaginatedResult } from '@prasad-rtns/shared';

/**
 * MssqlUserDAL — SQL Server implementation of IUserDAL.
 * Uses parameterised queries exclusively to prevent SQL injection.
 */
export class MssqlUserDAL implements IUserDAL {
  constructor(private readonly pool: ConnectionPool) {}

  // ─── findById ────────────────────────────────────────────────────────────────
  async findById(id: string): Promise<IUser | null> {
    const r = await this.pool.request()
      .input('id', id)
      .query<IUser>('SELECT * FROM users WHERE id = @id AND status != \'deleted\'');
    return r.recordset[0] ?? null;
  }

  async findByIdWithRelations(id: string): Promise<IUser | null> {
    const r = await this.pool.request().input('id', id).query<IUser>(`
      SELECT u.*,
             r.id AS role_id, r.name AS role_name, r.slug AS role_slug, r.permissions AS role_permissions,
             d.id AS dept_id, d.name AS dept_name, d.code AS dept_code,
             de.id AS desig_id, de.name AS desig_name, de.code AS desig_code
      FROM   users u
      LEFT JOIN roles        r  ON r.id  = u.role_id
      LEFT JOIN departments  d  ON d.id  = u.department_id
      LEFT JOIN designations de ON de.id = u.designation_id
      WHERE  u.id = @id
    `);
    if (!r.recordset[0]) return null;
    return this._mapRow(r.recordset[0] as any);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    const r = await this.pool.request().input('email', email.toLowerCase())
      .query<IUser>('SELECT * FROM users WHERE email = @email');
    return r.recordset[0] ?? null;
  }

  async findByUsername(username: string): Promise<IUser | null> {
    const r = await this.pool.request().input('username', username)
      .query<IUser>('SELECT * FROM users WHERE username = @username');
    return r.recordset[0] ?? null;
  }

  async findByEmailOrUsername(identifier: string): Promise<IUser | null> {
    const r = await this.pool.request()
      .input('email', identifier.toLowerCase())
      .input('username', identifier)
      .query<IUser>('SELECT * FROM users WHERE email = @email OR username = @username');
    return r.recordset[0] ?? null;
  }

  async findAll(opts: UserFilter): Promise<PaginatedResult<IUser>> {
    return this.findFiltered(opts);
  }

  async findFiltered(filter: UserFilter): Promise<PaginatedResult<IUser>> {
    const { page = 1, limit = 10, search, sortBy = 'created_at', sortOrder = 'DESC',
      status, departmentId, roleId, departmentFilter, userFilter } = filter;
    const offset = (page - 1) * limit;
    const req    = this.pool.request().input('offset', offset).input('limit', limit);

    const conditions: string[] = [];
    if (userFilter)                                          { req.input('userId', userFilter); conditions.push('u.id = @userId'); }
    else if (departmentFilter && departmentFilter !== 'all') { req.input('deptFilter', departmentFilter); conditions.push('u.department_id = @deptFilter'); }
    if (status)       { req.input('status', status);             conditions.push('u.status = @status'); }
    if (departmentId) { req.input('deptId',  departmentId);      conditions.push('u.department_id = @deptId'); }
    if (roleId)       { req.input('roleId',  roleId);            conditions.push('u.role_id = @roleId'); }
    if (search)       { req.input('search', `%${search}%`);      conditions.push('(u.first_name LIKE @search OR u.last_name LIKE @search OR u.email LIKE @search OR u.username LIKE @search)'); }

    const where    = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderCol = sortBy === 'email' ? 'u.email' : sortBy === 'firstName' ? 'u.first_name' : 'u.created_at';
    const orderDir = sortOrder === 'asc' ? 'ASC' : 'DESC';

    const sql = `
      SELECT u.*,
             r.id AS role_id, r.name AS role_name, r.slug AS role_slug,
             d.id AS dept_id, d.name AS dept_name,
             de.id AS desig_id, de.name AS desig_name
      FROM   users u
      LEFT JOIN roles        r  ON r.id  = u.role_id
      LEFT JOIN departments  d  ON d.id  = u.department_id
      LEFT JOIN designations de ON de.id = u.designation_id
      ${where}
      ORDER BY ${orderCol} ${orderDir}
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `;
    const countSql = `SELECT COUNT(*) AS total FROM users u ${where}`;

    const [data, count] = await Promise.all([
      req.query<IUser>(sql),
      this.pool.request().query<{ total: number }>(countSql),
    ]);

    return { data: data.recordset.map(r => this._mapRow(r as any)), total: count.recordset[0]?.total ?? 0 };
  }

  async create(data: CreateUserDTO): Promise<IUser> {
    const id  = uuidv4();
    const now = new Date();
    await this.pool.request()
      .input('id', id)
      .input('username', data.username)
      .input('email', data.email)
      .input('password', data.password)
      .input('firstName', data.firstName)
      .input('lastName', data.lastName)
      .input('phone', data.phone ?? null)
      .input('avatar', data.avatar ?? null)
      .input('roleId', data.roleId)
      .input('departmentId', data.departmentId)
      .input('designationId', data.designationId)
      .input('userCategory', data.userCategory ?? 'internal')
      .input('createdBy', data.createdBy ?? null)
      .input('now', now)
      .query(`
        INSERT INTO users (id, username, email, password, first_name, last_name, phone, avatar,
                           role_id, department_id, designation_id, user_category, status, is_email_verified,
                           failed_login_attempts, two_factor_enabled, created_by, created_at, updated_at)
        VALUES (@id, @username, @email, @password, @firstName, @lastName, @phone, @avatar,
                @roleId, @departmentId, @designationId, @userCategory, 'active', 0, 0, 0, @createdBy, @now, @now)
      `);
    const user = await this.findById(id);
    return user!;
  }

  async update(id: string, data: UpdateUserDTO): Promise<IUser | null> {
    const updates: string[] = [];
    const req = this.pool.request().input('id', id).input('updatedAt', new Date());
    const fieldMap: Record<string, string> = {
      firstName: 'first_name', lastName: 'last_name', phone: 'phone', avatar: 'avatar',
      roleId: 'role_id', departmentId: 'department_id', designationId: 'designation_id',
      status: 'status', password: 'password', isEmailVerified: 'is_email_verified',
      failedLoginAttempts: 'failed_login_attempts', lockUntil: 'lock_until',
      lastLoginAt: 'last_login_at', lastLoginIp: 'last_login_ip', updatedBy: 'updated_by',
    };
    for (const [key, col] of Object.entries(fieldMap)) {
      if (key in data && (data as Record<string, unknown>)[key] !== undefined) {
        req.input(key, (data as Record<string, unknown>)[key]);
        updates.push(`${col} = @${key}`);
      }
    }
    if (!updates.length) return this.findById(id);
    updates.push('updated_at = @updatedAt');
    await req.query(`UPDATE users SET ${updates.join(', ')} WHERE id = @id`);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const r = await this.pool.request().input('id', id)
      .query('DELETE FROM users WHERE id = @id');
    return (r.rowsAffected[0] ?? 0) > 0;
  }

  async incrementFailedLogins(id: string): Promise<number> {
    const r = await this.pool.request().input('id', id).query<{ failed_login_attempts: number }>(`
      UPDATE users SET failed_login_attempts = failed_login_attempts + 1, updated_at = GETUTCDATE()
      OUTPUT INSERTED.failed_login_attempts
      WHERE id = @id
    `);
    return r.recordset[0]?.failed_login_attempts ?? 0;
  }

  async resetFailedLogins(id: string): Promise<void> {
    await this.pool.request().input('id', id)
      .query("UPDATE users SET failed_login_attempts = 0, lock_until = NULL, updated_at = GETUTCDATE() WHERE id = @id");
  }

  async lockAccount(id: string, until: Date): Promise<void> {
    await this.pool.request().input('id', id).input('until', until)
      .query('UPDATE users SET lock_until = @until, updated_at = GETUTCDATE() WHERE id = @id');
  }

  async updateLastLogin(id: string, ip: string): Promise<void> {
    await this.pool.request().input('id', id).input('ip', ip)
      .query('UPDATE users SET last_login_at = GETUTCDATE(), last_login_ip = @ip, updated_at = GETUTCDATE() WHERE id = @id');
  }

  async changeStatus(id: string, status: IUser['status'], updatedBy: string): Promise<boolean> {
    const r = await this.pool.request().input('id', id).input('status', status).input('updatedBy', updatedBy)
      .query('UPDATE users SET status = @status, updated_by = @updatedBy, updated_at = GETUTCDATE() WHERE id = @id');
    return (r.rowsAffected[0] ?? 0) > 0;
  }

  async softDelete(id: string, deletedBy: string): Promise<boolean> {
    return this.changeStatus(id, 'inactive', deletedBy);
  }

  async countByFilter(filter: Partial<UserFilter>): Promise<number> {
    const req = this.pool.request();
    const conditions: string[] = [];
    if (filter.userFilter)                                               { req.input('userId', filter.userFilter); conditions.push('id = @userId'); }
    else if (filter.departmentFilter && filter.departmentFilter !== 'all') { req.input('deptFilter', filter.departmentFilter); conditions.push('department_id = @deptFilter'); }
    if (filter.status)       { req.input('status', filter.status);      conditions.push('status = @status'); }
    if (filter.departmentId) { req.input('deptId', filter.departmentId);conditions.push('department_id = @deptId'); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const r = await req.query<{ total: number }>(`SELECT COUNT(*) AS total FROM users ${where}`);
    return r.recordset[0]?.total ?? 0;
  }

  // ─── Helper: map flat SQL row to nested User shape ────────────────────────────
  private _mapRow(row: Record<string, unknown>): IUser {
    return {
      id:                     row.id as string,
      username:               row.username as string,
      email:                  row.email as string,
      password:               row.password as string,
      firstName:              (row.first_name ?? row.firstName) as string,
      lastName:               (row.last_name  ?? row.lastName)  as string,
      phone:                  (row.phone ?? null) as string | null,
      avatar:                 (row.avatar ?? null) as string | null,
      roleId:                 (row.role_id ?? row.roleId) as string,
      departmentId:           (row.department_id ?? row.departmentId) as string,
      designationId:          (row.designation_id ?? row.designationId) as string,
      userCategory:           (row.user_category ?? row.userCategory ?? 'internal') as IUser['userCategory'],
      status:                 row.status as IUser['status'],
      isEmailVerified:        Boolean(row.is_email_verified),
      emailVerificationToken: (row.email_verification_token ?? null) as string | null,
      passwordResetToken:     (row.password_reset_token ?? null) as string | null,
      passwordResetExpires:   (row.password_reset_expires ?? null) as Date | null,
      failedLoginAttempts:    Number(row.failed_login_attempts ?? 0),
      lockUntil:              (row.lock_until ?? null) as Date | null,
      twoFactorSecret:        (row.two_factor_secret ?? null) as string | null,
      twoFactorEnabled:       Boolean(row.two_factor_enabled),
      lastLoginAt:            (row.last_login_at ?? null) as Date | null,
      lastLoginIp:            (row.last_login_ip ?? null) as string | null,
      createdBy:              (row.created_by ?? null) as string | null,
      updatedBy:              (row.updated_by ?? null) as string | null,
      createdAt:              row.created_at as Date,
      updatedAt:              row.updated_at as Date,
      role:        row.role_slug ? { id: row.role_id, slug: row.role_slug, name: row.role_name, permissions: [] } as unknown as IUser['role'] : undefined,
      department:  row.dept_name ? { id: row.dept_id, name: row.dept_name } as unknown as IUser['department'] : undefined,
      designation: row.desig_name ? { id: row.desig_id, name: row.desig_name } as unknown as IUser['designation'] : undefined,
    };
  }
}
