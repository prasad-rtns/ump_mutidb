import { and, asc, count, desc, eq, like, or, sql } from 'drizzle-orm';
import type { MySql2Database } from 'drizzle-orm/mysql2';
import { v4 as uuidv4 } from 'uuid';
import { PaginatedResult } from '@prasad-rtns/shared';
import { users, roles, companies, departments, designations, sessions } from '../../schemas/mysql.schema';
import { IUserDAL } from '../interfaces/user.dal.interface';
import { ISessionDAL } from '../interfaces/session.dal.interface';
import { IRoleDAL, IDepartmentDAL, IDesignationDAL } from '../interfaces/role-dept-desig.dal.interface';
import { IUser, CreateUserDTO, UpdateUserDTO, UserFilter } from '../../modules/user/user.types';
import { ISession, CreateSessionDTO } from '../../modules/common/common.types';
import {
  IRole,
  IDepartment,
  IDesignation,
  CreateRoleDTO,
  UpdateRoleDTO,
  CreateDepartmentDTO,
  UpdateDepartmentDTO,
  CreateDesignationDTO,
  UpdateDesignationDTO,
} from '../../modules/master/master.types';

type MysqlDB = MySql2Database<any>;

const now = () => new Date();

const mapUser = (row: typeof users.$inferSelect): IUser => ({
  ...row,
  userCategory: row.userCategory ?? 'internal',
  phone: row.phone ?? null,
  avatar: row.avatar ?? null,
  companyId: row.companyId ?? null,
  emailVerificationToken: row.emailVerificationToken ?? null,
  passwordResetToken: row.passwordResetToken ?? null,
  passwordResetExpires: row.passwordResetExpires ?? null,
  lockUntil: row.lockUntil ?? null,
  twoFactorSecret: row.twoFactorSecret ?? null,
  lastLoginAt: row.lastLoginAt ?? null,
  lastLoginIp: row.lastLoginIp ?? null,
  createdBy: row.createdBy ?? null,
  updatedBy: row.updatedBy ?? null,
});

const mapRole = (row: typeof roles.$inferSelect): IRole => ({
  ...row,
  permissions: row.permissions ?? [],
});

export class MysqlUserDAL implements IUserDAL {
  constructor(private readonly db: MysqlDB) {}

  async findById(id: string): Promise<IUser | null> {
    const rows = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return rows[0] ? mapUser(rows[0]) : null;
  }

  async findByIdWithRelations(id: string): Promise<IUser | null> {
    const rows = await this.db
      .select({ user: users, role: roles, company: companies, department: departments, designation: designations })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .leftJoin(companies, eq(users.companyId, companies.id))
      .leftJoin(departments, eq(users.departmentId, departments.id))
      .leftJoin(designations, eq(users.designationId, designations.id))
      .where(eq(users.id, id))
      .limit(1);

    if (!rows[0]) return null;
    return {
      ...mapUser(rows[0].user),
      role: rows[0].role ? mapRole(rows[0].role) : undefined,
      company: rows[0].company ?? undefined,
      department: rows[0].department ?? undefined,
      designation: rows[0].designation ?? undefined,
    };
  }

  async findByEmail(email: string): Promise<IUser | null> {
    const rows = await this.db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    return rows[0] ? mapUser(rows[0]) : null;
  }

  async findByUsername(username: string): Promise<IUser | null> {
    const rows = await this.db.select().from(users).where(eq(users.username, username)).limit(1);
    return rows[0] ? mapUser(rows[0]) : null;
  }

  async findByEmailOrUsername(identifier: string): Promise<IUser | null> {
    const rows = await this.db
      .select()
      .from(users)
      .where(or(eq(users.email, identifier.toLowerCase()), eq(users.username, identifier)))
      .limit(1);
    return rows[0] ? mapUser(rows[0]) : null;
  }

  async findAll(opts: UserFilter): Promise<PaginatedResult<IUser>> {
    return this.findFiltered(opts);
  }

  async findFiltered(filter: UserFilter): Promise<PaginatedResult<IUser>> {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status,
      departmentId,
      roleId,
      departmentFilter,
      userFilter,
    } = filter;

    const offset = (page - 1) * limit;
    const conditions = [];

    if (userFilter) conditions.push(eq(users.id, userFilter));
    else if (departmentFilter && departmentFilter !== 'all') conditions.push(eq(users.departmentId, departmentFilter));
    if (status) conditions.push(eq(users.status, status));
    if (departmentId) conditions.push(eq(users.departmentId, departmentId));
    if (roleId) conditions.push(eq(users.roleId, roleId));
    if (filter.companyId) conditions.push(eq(users.companyId, filter.companyId));
    if (filter.userCategory) conditions.push(eq(users.userCategory, filter.userCategory));
    if (search) {
      conditions.push(
        or(
          like(users.firstName, `%${search}%`),
          like(users.lastName, `%${search}%`),
          like(users.email, `%${search}%`),
          like(users.username, `%${search}%`)
        )!
      );
    }

    const where = conditions.length ? and(...conditions) : undefined;
    const orderCol = sortBy === 'email' ? users.email : sortBy === 'firstName' ? users.firstName : users.createdAt;
    const order = sortOrder === 'asc' ? asc(orderCol) : desc(orderCol);

    const [data, totals] = await Promise.all([
      this.db
        .select({ user: users, role: roles, company: companies, department: departments, designation: designations })
        .from(users)
        .leftJoin(roles, eq(users.roleId, roles.id))
        .leftJoin(companies, eq(users.companyId, companies.id))
        .leftJoin(departments, eq(users.departmentId, departments.id))
        .leftJoin(designations, eq(users.designationId, designations.id))
        .where(where)
        .orderBy(order)
        .limit(limit)
        .offset(offset),
      this.db.select({ total: count() }).from(users).where(where),
    ]);

    return {
      data: data.map(({ user, role, company, department, designation }) => ({
        ...mapUser(user),
        role: role ? mapRole(role) : undefined,
        company: company ?? undefined,
        department: department ?? undefined,
        designation: designation ?? undefined,
      })),
      total: Number(totals[0]?.total ?? 0),
    };
  }

  async create(data: CreateUserDTO): Promise<IUser> {
    const id = uuidv4();
    const timestamp = now();

    await this.db.insert(users).values({
      id,
      username: data.username,
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone ?? null,
      avatar: data.avatar ?? null,
      roleId: data.roleId,
      companyId: data.companyId ?? null,
      departmentId: data.departmentId,
      designationId: data.designationId,
      userCategory: data.userCategory ?? 'internal',
      status: 'active',
      isEmailVerified: false,
      failedLoginAttempts: 0,
      twoFactorEnabled: false,
      createdBy: data.createdBy ?? null,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    return (await this.findById(id))!;
  }

  async update(id: string, data: UpdateUserDTO): Promise<IUser | null> {
    const updateData: Partial<typeof users.$inferInsert> = {
      updatedAt: now(),
    };

    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.middleName !== undefined) updateData.middleName = data.middleName ?? null;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.phone !== undefined) updateData.phone = data.phone ?? null;
    if (data.avatar !== undefined) updateData.avatar = data.avatar ?? null;
    if (data.roleId !== undefined) updateData.roleId = data.roleId;
    if (data.companyId !== undefined) updateData.companyId = data.companyId ?? null;
    if (data.departmentId !== undefined) updateData.departmentId = data.departmentId;
    if (data.designationId !== undefined) updateData.designationId = data.designationId;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.password !== undefined) updateData.password = data.password;
    if (data.isEmailVerified !== undefined) updateData.isEmailVerified = data.isEmailVerified;
    if (data.emailVerificationToken !== undefined) updateData.emailVerificationToken = data.emailVerificationToken ?? null;
    if (data.passwordResetToken !== undefined) updateData.passwordResetToken = data.passwordResetToken ?? null;
    if (data.passwordResetExpires !== undefined) updateData.passwordResetExpires = data.passwordResetExpires ?? null;
    if (data.failedLoginAttempts !== undefined) updateData.failedLoginAttempts = data.failedLoginAttempts;
    if (data.lockUntil !== undefined) updateData.lockUntil = data.lockUntil ?? null;
    if (data.lastLoginAt !== undefined) updateData.lastLoginAt = data.lastLoginAt ?? null;
    if (data.lastLoginIp !== undefined) updateData.lastLoginIp = data.lastLoginIp ?? null;
    if (data.updatedBy !== undefined) updateData.updatedBy = data.updatedBy ?? null;

    await this.db.update(users).set(updateData).where(eq(users.id, id));
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    await this.db.delete(users).where(eq(users.id, id));
    return true;
  }

  async incrementFailedLogins(id: string): Promise<number> {
    await this.db
      .update(users)
      .set({ failedLoginAttempts: sql`${users.failedLoginAttempts} + 1`, updatedAt: now() })
      .where(eq(users.id, id));

    const user = await this.findById(id);
    return user?.failedLoginAttempts ?? 0;
  }

  async resetFailedLogins(id: string): Promise<void> {
    await this.db
      .update(users)
      .set({ failedLoginAttempts: 0, lockUntil: null, updatedAt: now() })
      .where(eq(users.id, id));
  }

  async lockAccount(id: string, until: Date): Promise<void> {
    await this.db.update(users).set({ lockUntil: until, updatedAt: now() }).where(eq(users.id, id));
  }

  async updateLastLogin(id: string, ip: string): Promise<void> {
    await this.db
      .update(users)
      .set({ lastLoginAt: now(), lastLoginIp: ip, updatedAt: now() })
      .where(eq(users.id, id));
  }

  async changeStatus(id: string, status: IUser['status'], updatedBy: string): Promise<boolean> {
    await this.db.update(users).set({ status, updatedBy, updatedAt: now() }).where(eq(users.id, id));
    return true;
  }

  async softDelete(id: string, deletedBy: string): Promise<boolean> {
    return this.changeStatus(id, 'inactive', deletedBy);
  }

  async countByFilter(filter: Partial<UserFilter>): Promise<number> {
    const conditions = [];
    if (filter.userFilter) conditions.push(eq(users.id, filter.userFilter));
    else if (filter.departmentFilter && filter.departmentFilter !== 'all') conditions.push(eq(users.departmentId, filter.departmentFilter));
    if (filter.status) conditions.push(eq(users.status, filter.status));
    if (filter.departmentId) conditions.push(eq(users.departmentId, filter.departmentId));
    if (filter.roleId) conditions.push(eq(users.roleId, filter.roleId));
    if (filter.companyId) conditions.push(eq(users.companyId, filter.companyId));
    if (filter.userCategory) conditions.push(eq(users.userCategory, filter.userCategory));
    const where = conditions.length ? and(...conditions) : undefined;
    const totals = await this.db.select({ total: count() }).from(users).where(where);
    return Number(totals[0]?.total ?? 0);
  }
}

export class MysqlSessionDAL implements ISessionDAL {
  constructor(private readonly db: MysqlDB) {}

  async create(data: CreateSessionDTO): Promise<ISession> {
    const id = uuidv4();
    const createdAt = now();

    await this.db.insert(sessions).values({
      id,
      ...data,
      isRevoked: false,
      createdAt,
    });

    return (await this.findByRefreshToken(data.refreshToken))!;
  }

  async findByRefreshToken(token: string): Promise<ISession | null> {
    const rows = await this.db
      .select()
      .from(sessions)
      .where(and(eq(sessions.refreshToken, token), eq(sessions.isRevoked, false)))
      .limit(1);
    return (rows[0] as ISession | undefined) ?? null;
  }

  async findActiveByUserId(userId: string): Promise<ISession[]> {
    const rows = await this.db
      .select()
      .from(sessions)
      .where(and(eq(sessions.userId, userId), eq(sessions.isRevoked, false)));
    return rows as ISession[];
  }

  async revokeByToken(token: string): Promise<void> {
    await this.db.update(sessions).set({ isRevoked: true }).where(eq(sessions.refreshToken, token));
  }

  async revokeAllByUserId(userId: string): Promise<void> {
    await this.db.update(sessions).set({ isRevoked: true }).where(eq(sessions.userId, userId));
  }

  async deleteExpired(): Promise<number> {
    const expired = await this.db.select({ total: count() }).from(sessions).where(sql`${sessions.expiresAt} < ${now()}`);
    await this.db.delete(sessions).where(sql`${sessions.expiresAt} < ${now()}`);
    return Number(expired[0]?.total ?? 0);
  }
}

export class MysqlRoleDAL implements IRoleDAL {
  constructor(private readonly db: MysqlDB) {}

  async findAll(activeOnly = true): Promise<IRole[]> {
    return this.db.select().from(roles).where(activeOnly ? eq(roles.isActive, true) : undefined) as Promise<IRole[]>;
  }

  async findById(id: string): Promise<IRole | null> {
    const rows = await this.db.select().from(roles).where(eq(roles.id, id)).limit(1);
    return (rows[0] as IRole | undefined) ?? null;
  }

  async findBySlug(slug: IRole['slug']): Promise<IRole | null> {
    const rows = await this.db.select().from(roles).where(eq(roles.slug, slug)).limit(1);
    return (rows[0] as IRole | undefined) ?? null;
  }

  async create(data: CreateRoleDTO): Promise<IRole> {
    const id = uuidv4();
    const timestamp = now();
    await this.db.insert(roles).values({
      id,
      name: data.name,
      slug: data.slug,
      description: data.description ?? null,
      permissions: data.permissions ?? [],
      isActive: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    return (await this.findById(id))!;
  }

  async update(id: string, data: UpdateRoleDTO): Promise<IRole | null> {
    await this.db.update(roles).set({ ...data, updatedAt: now() }).where(eq(roles.id, id));
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    await this.db.update(roles).set({ isActive: false, updatedAt: now() }).where(eq(roles.id, id));
    return true;
  }
}

export class MysqlDepartmentDAL implements IDepartmentDAL {
  constructor(private readonly db: MysqlDB) {}

  async findAll(activeOnly = true): Promise<IDepartment[]> {
    return this.db.select().from(departments).where(activeOnly ? eq(departments.isActive, true) : undefined) as Promise<IDepartment[]>;
  }

  async findById(id: string): Promise<IDepartment | null> {
    const rows = await this.db.select().from(departments).where(eq(departments.id, id)).limit(1);
    return (rows[0] as IDepartment | undefined) ?? null;
  }

  async findByCode(code: string): Promise<IDepartment | null> {
    const rows = await this.db.select().from(departments).where(eq(departments.code, code)).limit(1);
    return (rows[0] as IDepartment | undefined) ?? null;
  }

  async findChildren(parentId: string): Promise<IDepartment[]> {
    return this.db.select().from(departments).where(eq(departments.parentId, parentId)) as Promise<IDepartment[]>;
  }

  async create(data: CreateDepartmentDTO): Promise<IDepartment> {
    const id = uuidv4();
    const timestamp = now();
    await this.db.insert(departments).values({ id, ...data, isActive: true, createdAt: timestamp, updatedAt: timestamp });
    return (await this.findById(id))!;
  }

  async update(id: string, data: UpdateDepartmentDTO): Promise<IDepartment | null> {
    await this.db.update(departments).set({ ...data, updatedAt: now() }).where(eq(departments.id, id));
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    await this.db.update(departments).set({ isActive: false, updatedAt: now() }).where(eq(departments.id, id));
    return true;
  }
}

export class MysqlDesignationDAL implements IDesignationDAL {
  constructor(private readonly db: MysqlDB) {}

  async findAll(activeOnly = true): Promise<IDesignation[]> {
    return this.db.select().from(designations).where(activeOnly ? eq(designations.isActive, true) : undefined) as Promise<IDesignation[]>;
  }

  async findByDepartment(departmentId: string, activeOnly = true): Promise<IDesignation[]> {
    const where = activeOnly
      ? and(eq(designations.departmentId, departmentId), eq(designations.isActive, true))
      : eq(designations.departmentId, departmentId);
    return this.db.select().from(designations).where(where) as Promise<IDesignation[]>;
  }

  async findById(id: string): Promise<IDesignation | null> {
    const rows = await this.db.select().from(designations).where(eq(designations.id, id)).limit(1);
    return (rows[0] as IDesignation | undefined) ?? null;
  }

  async findByCode(code: string): Promise<IDesignation | null> {
    const rows = await this.db.select().from(designations).where(eq(designations.code, code)).limit(1);
    return (rows[0] as IDesignation | undefined) ?? null;
  }

  async create(data: CreateDesignationDTO): Promise<IDesignation> {
    const id = uuidv4();
    const timestamp = now();
    await this.db.insert(designations).values({
      id,
      ...data,
      level: data.level ?? 1,
      isActive: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    return (await this.findById(id))!;
  }

  async update(id: string, data: UpdateDesignationDTO): Promise<IDesignation | null> {
    await this.db.update(designations).set({ ...data, updatedAt: now() }).where(eq(designations.id, id));
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    await this.db.update(designations).set({ isActive: false, updatedAt: now() }).where(eq(designations.id, id));
    return true;
  }
}
