import { eq, and, or, ilike, count, desc, asc, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { users, roles, departments, designations } from '../../schemas/pg.schema';
import { IUserDAL } from '../interfaces/user.dal.interface';
import { IUser, CreateUserDTO, UpdateUserDTO, UserFilter } from '../../modules/user/user.types';
import { PaginatedResult } from '@prasad-rtns/shared';

type PgDB = NodePgDatabase<Record<string, never>>;

export class PgUserDAL implements IUserDAL {
  constructor(private readonly db: PgDB) {}

  // ─── findById ────────────────────────────────────────────────────────────────
  async findById(id: string): Promise<IUser | null> {
    const rows = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return (rows[0] as unknown as IUser) ?? null;
  }

  // ─── findByIdWithRelations ────────────────────────────────────────────────────
  async findByIdWithRelations(id: string): Promise<IUser | null> {
    const rows = await this.db
      .select({
        user: users,
        role: roles,
        department: departments,
        designation: designations,
      })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .leftJoin(departments, eq(users.departmentId, departments.id))
      .leftJoin(designations, eq(users.designationId, designations.id))
      .where(eq(users.id, id))
      .limit(1);

    if (!rows[0]) return null;
    const { user, role, department, designation } = rows[0];
    return { ...user, role: role ?? undefined, department: department ?? undefined, designation: designation ?? undefined } as unknown as IUser;
  }

  // ─── findByEmail ──────────────────────────────────────────────────────────────
  async findByEmail(email: string): Promise<IUser | null> {
    const rows = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);
    return (rows[0] as unknown as IUser) ?? null;
  }

  // ─── findByUsername ───────────────────────────────────────────────────────────
  async findByUsername(username: string): Promise<IUser | null> {
    const rows = await this.db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);
    return (rows[0] as unknown as IUser) ?? null;
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
    return (rows[0] as unknown as IUser) ?? null;
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
      status, departmentId, roleId,
      departmentFilter, userFilter,
    } = filter;

    const offset = (page - 1) * limit;
    const conditions = [];

    if (userFilter)                                    conditions.push(eq(users.id, userFilter));
    else if (departmentFilter && departmentFilter !== 'all') conditions.push(eq(users.departmentId, departmentFilter));
    if (status)       conditions.push(eq(users.status, status));
    if (departmentId) conditions.push(eq(users.departmentId, departmentId));
    if (roleId)       conditions.push(eq(users.roleId, roleId));
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
        department: departments,
        designation: designations,
      })
        .from(users)
        .leftJoin(roles, eq(users.roleId, roles.id))
        .leftJoin(departments, eq(users.departmentId, departments.id))
        .leftJoin(designations, eq(users.designationId, designations.id))
        .where(where)
        .orderBy(order)
        .limit(limit)
        .offset(offset),
      this.db.select({ total: count() }).from(users).where(where),
    ]);

    const mapped = data.map(({ user, role, department, designation }) =>
      ({ ...user, role: role ?? undefined, department: department ?? undefined, designation: designation ?? undefined } as unknown as IUser)
    );

    return { data: mapped, total: Number(total) };
  }

  // ─── create ───────────────────────────────────────────────────────────────────
  async create(data: CreateUserDTO): Promise<IUser> {
    const now = new Date();
    const rows = await this.db
      .insert(users)
      .values({ id: uuidv4(), ...data, createdAt: now, updatedAt: now })
      .returning();
    return rows[0] as unknown as IUser;
  }

  // ─── update ───────────────────────────────────────────────────────────────────
  async update(id: string, data: UpdateUserDTO): Promise<IUser | null> {
    const rows = await this.db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return (rows[0] as unknown as IUser) ?? null;
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
      .set({ failedLoginAttempts: 0, lockUntil: undefined, updatedAt: new Date() })
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
    const { status, departmentId, departmentFilter, userFilter } = filter;
    const conditions = [];
    if (userFilter)                                          conditions.push(eq(users.id, userFilter));
    else if (departmentFilter && departmentFilter !== 'all') conditions.push(eq(users.departmentId, departmentFilter));
    if (status)       conditions.push(eq(users.status, status));
    if (departmentId) conditions.push(eq(users.departmentId, departmentId));
    const where = conditions.length ? and(...conditions) : undefined;
    const [{ total }] = await this.db.select({ total: count() }).from(users).where(where);
    return Number(total);
  }
}
