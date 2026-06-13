import { eq, and, or, ilike, count, desc, asc, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { users, roles, companies, departments, designations } from '../../schemas/pg.schema';
import { IUserDAL } from '../interfaces/user.dal.interface';
import { IUser, CreateUserDTO, UpdateUserDTO, UserFilter } from '../../modules/user/user.types';
import { PaginatedResult } from '@rtns/core';
import type { IRole } from '../../modules/master/master.types';
import { parsePermissions } from '../common/rbms.mapper';

type PgDB = NodePgDatabase<Record<string, never>>;
type PgUserRow = typeof users.$inferSelect;
type PgRoleRow = typeof roles.$inferSelect;

const mapUser = (row: PgUserRow): IUser => ({
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

const mapRole = (row: PgRoleRow): IRole => ({
  ...row,
  permissions: parsePermissions(row.permissions),
});

export class PgUserDAL implements IUserDAL {
  constructor(private readonly db: PgDB) {}

  // ─── findById ────────────────────────────────────────────────────────────────
  async findById(id: string): Promise<IUser | null> {
    const rows = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return rows[0] ? mapUser(rows[0]) : null;
  }

  // ─── findByIdWithRelations ────────────────────────────────────────────────────
  async findByIdWithRelations(id: string): Promise<IUser | null> {
    const rows = await this.db
      .select({
        user: users,
        role: roles,
        company: companies,
        department: departments,
        designation: designations,
      })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .leftJoin(companies, eq(users.companyId, companies.id))
      .leftJoin(departments, eq(users.departmentId, departments.id))
      .leftJoin(designations, eq(users.designationId, designations.id))
      .where(eq(users.id, id))
      .limit(1);

    if (!rows[0]) return null;
    const { user, role, company, department, designation } = rows[0];
    return {
      ...mapUser(user),
      role: role ? mapRole(role) : undefined,
      company: company ?? undefined,
      department: department ?? undefined,
      designation: designation ?? undefined,
    };
  }

  // ─── findByEmail ──────────────────────────────────────────────────────────────
  async findByEmail(email: string): Promise<IUser | null> {
    const rows = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);
    return rows[0] ? mapUser(rows[0]) : null;
  }

  // ─── findByUsername ───────────────────────────────────────────────────────────
  async findByUsername(username: string): Promise<IUser | null> {
    const rows = await this.db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);
    return rows[0] ? mapUser(rows[0]) : null;
  }

  // ─── findByEmailOrUsername ────────────────────────────────────────────────────
  async findByEmailOrUsername(identifier: string): Promise<IUser | null> {
    const rows = await this.db
      .select()
      .from(users)
      .where(
        or(
          eq(users.email, identifier.toLowerCase()),
          eq(users.username, identifier)
        )
      )
      .limit(1);
    return rows[0] ? mapUser(rows[0]) : null;
  }

  // ─── findAll ──────────────────────────────────────────────────────────────────
  async findAll(opts: UserFilter): Promise<PaginatedResult<IUser>> {
    return this.findFiltered(opts);
  }

  // ─── findFiltered ─────────────────────────────────────────────────────────────
  async findFiltered(filter: UserFilter): Promise<PaginatedResult<IUser>> {
    const {
      page = 1, limit = 10, search,
      sortBy = 'createdAt', sortOrder = 'desc',
      status, departmentId, roleId, companyId, userCategory,
      departmentFilter, userFilter,
    } = filter;

    const offset = (page - 1) * limit;
    const conditions = [];

    if (userFilter)                                    conditions.push(eq(users.id, userFilter));
    else if (departmentFilter && departmentFilter !== 'all') conditions.push(eq(users.departmentId, departmentFilter));
    if (status)       conditions.push(eq(users.status, status));
    if (departmentId) conditions.push(eq(users.departmentId, departmentId));
    if (roleId)       conditions.push(eq(users.roleId, roleId));
    if (companyId)    conditions.push(eq(users.companyId, companyId));
    if (userCategory) conditions.push(eq(users.userCategory, userCategory));
    if (search)       conditions.push(or(
      ilike(users.firstName, `%${search}%`),
      ilike(users.lastName,  `%${search}%`),
      ilike(users.email,     `%${search}%`),
      ilike(users.username,  `%${search}%`)
    )!);

    const where = conditions.length ? and(...conditions) : undefined;
    const orderCol = sortBy === 'email' ? users.email : sortBy === 'firstName' ? users.firstName : users.createdAt;
    const order    = sortOrder === 'asc' ? asc(orderCol) : desc(orderCol);

    const [data, [{ total }]] = await Promise.all([
      this.db.select({
        user: users,
        role: roles,
        company: companies,
        department: departments,
        designation: designations,
      })
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

    const mapped = data.map(({ user, role, company, department, designation }) => ({
      ...mapUser(user),
      role: role ? mapRole(role) : undefined,
      company: company ?? undefined,
      department: department ?? undefined,
      designation: designation ?? undefined,
    }));

    return { data: mapped, total: Number(total) };
  }

  // ─── create ───────────────────────────────────────────────────────────────────
  async create(data: CreateUserDTO): Promise<IUser> {
    const now = new Date();
    const id = uuidv4();
    const rows = await this.db
      .insert(users)
      .values({
        id,
        username: data.username,
        email: data.email.toLowerCase(),
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
        isEmailVerified: data.isEmailVerified ?? false,
        failedLoginAttempts: 0,
        twoFactorEnabled: data.twoFactorEnabled ?? false,
        createdBy: data.createdBy ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return mapUser(rows[0]);
  }

  // ─── update ───────────────────────────────────────────────────────────────────
  async update(id: string, data: UpdateUserDTO): Promise<IUser | null> {
    const updateData: Partial<typeof users.$inferInsert> = { updatedAt: new Date() };
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
    if (data.twoFactorEnabled !== undefined) updateData.twoFactorEnabled = data.twoFactorEnabled;
    if (data.emailVerificationToken !== undefined) updateData.emailVerificationToken = data.emailVerificationToken ?? null;
    if (data.passwordResetToken !== undefined) updateData.passwordResetToken = data.passwordResetToken ?? null;
    if (data.passwordResetExpires !== undefined) updateData.passwordResetExpires = data.passwordResetExpires ?? null;
    if (data.failedLoginAttempts !== undefined) updateData.failedLoginAttempts = data.failedLoginAttempts;
    if (data.lockUntil !== undefined) updateData.lockUntil = data.lockUntil ?? null;
    if (data.lastLoginAt !== undefined) updateData.lastLoginAt = data.lastLoginAt ?? null;
    if (data.lastLoginIp !== undefined) updateData.lastLoginIp = data.lastLoginIp ?? null;
    if (data.updatedBy !== undefined) updateData.updatedBy = data.updatedBy ?? null;

    const rows = await this.db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return rows[0] ? mapUser(rows[0]) : null;
  }

  // ─── delete (hard) ────────────────────────────────────────────────────────────
  async delete(id: string): Promise<boolean> {
    const rows = await this.db.delete(users).where(eq(users.id, id)).returning({ id: users.id });
    return rows.length > 0;
  }

  // ─── incrementFailedLogins ────────────────────────────────────────────────────
  async incrementFailedLogins(id: string): Promise<number> {
    const rows = await this.db
      .update(users)
      .set({ failedLoginAttempts: sql`${users.failedLoginAttempts} + 1`, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning({ failedLoginAttempts: users.failedLoginAttempts });
    return (rows[0]?.failedLoginAttempts as number) ?? 0;
  }

  // ─── resetFailedLogins ────────────────────────────────────────────────────────
  async resetFailedLogins(id: string): Promise<void> {
    await this.db
      .update(users)
      .set({ failedLoginAttempts: 0, lockUntil: null, updatedAt: new Date() })
      .where(eq(users.id, id));
  }

  // ─── lockAccount ─────────────────────────────────────────────────────────────
  async lockAccount(id: string, until: Date): Promise<void> {
    await this.db.update(users).set({ lockUntil: until, updatedAt: new Date() }).where(eq(users.id, id));
  }

  // ─── updateLastLogin ─────────────────────────────────────────────────────────
  async updateLastLogin(id: string, ip: string): Promise<void> {
    await this.db
      .update(users)
      .set({ lastLoginAt: new Date(), lastLoginIp: ip, updatedAt: new Date() })
      .where(eq(users.id, id));
  }

  // ─── changeStatus ─────────────────────────────────────────────────────────────
  async changeStatus(id: string, status: IUser['status'], updatedBy: string): Promise<boolean> {
    const rows = await this.db
      .update(users)
      .set({ status, updatedBy, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning({ id: users.id });
    return rows.length > 0;
  }

  // ─── softDelete ───────────────────────────────────────────────────────────────
  async softDelete(id: string, deletedBy: string): Promise<boolean> {
    return this.changeStatus(id, 'inactive', deletedBy);
  }

  // ─── countByFilter ────────────────────────────────────────────────────────────
  async countByFilter(filter: Partial<UserFilter>): Promise<number> {
    const { status, departmentId, departmentFilter, userFilter, roleId, companyId, userCategory } = filter;
    const conditions = [];
    if (userFilter)                                          conditions.push(eq(users.id, userFilter));
    else if (departmentFilter && departmentFilter !== 'all') conditions.push(eq(users.departmentId, departmentFilter));
    if (status)       conditions.push(eq(users.status, status));
    if (departmentId) conditions.push(eq(users.departmentId, departmentId));
    if (roleId)       conditions.push(eq(users.roleId, roleId));
    if (companyId)    conditions.push(eq(users.companyId, companyId));
    if (userCategory) conditions.push(eq(users.userCategory, userCategory));
    const where = conditions.length ? and(...conditions) : undefined;
    const [{ total }] = await this.db.select({ total: count() }).from(users).where(where);
    return Number(total);
  }
}
