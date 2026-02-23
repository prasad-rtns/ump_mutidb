import { eq, and, or, like, count, desc, sql, ilike } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { getDbConnection } from '../database/connection';
import { users, roles, departments, designations } from '../schemas/pg.schema';
import { DatabaseType, PaginationQuery } from '@prasad-rtns/shared';
import { IUser } from './types';

export class UserRepository {
  private dbType: DatabaseType;

  constructor(dbType: DatabaseType = 'postgres') {
    this.dbType = dbType;
  }

  // ─── Create user ─────────────────────────────────────────────────────────────
  async create(data: Omit<IUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<IUser> {
    const conn = await getDbConnection(this.dbType);

    if (this.dbType === 'mongodb') {
      const { collections } = conn as { collections: import('../schemas/mongo.schema').MongoCollections };
      const doc = {
        id: uuidv4(),
        ...(data as any),
        failedLoginAttempts: 0,
        twoFactorEnabled: false,
        isEmailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await collections.users.insertOne(doc);
      return doc as unknown as IUser;
    }

    // SQL databases (postgres/mysql)
    const { db } = conn as { db: import('drizzle-orm/node-postgres').NodePgDatabase };
    const result = await (db as unknown as ReturnType<typeof import('drizzle-orm/node-postgres').drizzle>)
      .insert(users)
      .values({
        id: uuidv4(),
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return result[0] as unknown as IUser;
  }

  // ─── Find by ID with relations ────────────────────────────────────────────────
  async findById(id: string): Promise<IUser | null> {
    const conn = await getDbConnection(this.dbType);

    if (this.dbType === 'mongodb') {
      const { collections } = conn as { collections: import('../schemas/mongo.schema').MongoCollections };
      const user = await collections.users.findOne({ id });
      if (!user) return null;
      const [role, dept, desig] = await Promise.all([
        collections.roles.findOne({ id: user.roleId }),
        collections.departments.findOne({ id: user.departmentId }),
        collections.designations.findOne({ id: user.designationId }),
      ]);
      return { ...user, role, department: dept, designation: desig } as unknown as IUser;
    }

    const { db } = conn as { db: ReturnType<typeof import('drizzle-orm/node-postgres').drizzle> };
    const result = await (db as unknown as { query: { users: { findFirst: (opts: unknown) => Promise<unknown> } } }).query.users.findFirst({
      where: eq(users.id, id),
      with: { role: true, department: true, designation: true },
    });
    return (result as IUser) || null;
  }

  // ─── Find by email ────────────────────────────────────────────────────────────
  async findByEmail(email: string): Promise<IUser | null> {
    const conn = await getDbConnection(this.dbType);

    if (this.dbType === 'mongodb') {
      const { collections } = conn as { collections: import('../schemas/mongo.schema').MongoCollections };
      const user = await collections.users.findOne({ email: email.toLowerCase() });
      return user as unknown as IUser | null;
    }

    const { db } = conn as { db: ReturnType<typeof import('drizzle-orm/node-postgres').drizzle> };
    const result = await (db as any).select().from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);
    return ((result as IUser[])[0]) || null;
  }

  // ─── Find by username ─────────────────────────────────────────────────────────
  async findByUsername(username: string): Promise<IUser | null> {
    const conn = await getDbConnection(this.dbType);

    if (this.dbType === 'mongodb') {
      const { collections } = conn as { collections: import('../schemas/mongo.schema').MongoCollections };
      const user = await collections.users.findOne({ username });
      return user as unknown as IUser | null;
    }

    const { db } = conn as { db: ReturnType<typeof import('drizzle-orm/node-postgres').drizzle> };
    const result = await (db as any).select().from(users)
      .where(eq(users.username, username))
      .limit(1);
    return ((result as IUser[])[0]) || null;
  }

  // ─── Update user ──────────────────────────────────────────────────────────────
  async update(id: string, data: Partial<IUser>): Promise<IUser | null> {
    const conn = await getDbConnection(this.dbType);

    if (this.dbType === 'mongodb') {
      const { collections } = conn as { collections: import('../schemas/mongo.schema').MongoCollections };
      const result = await collections.users.findOneAndUpdate(
        { id },
        { $set: { ...(data as any), updatedAt: new Date() } },
        { returnDocument: 'after' }
      );
      return result as unknown as IUser | null;
    }

    const { db } = conn as { db: ReturnType<typeof import('drizzle-orm/node-postgres').drizzle> };
    const result = await (db as any)
      .update(users)
      .set({ ...(data as any), updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return ((result as IUser[])[0]) || null;
  }

  // ─── Delete (soft delete) ────────────────────────────────────────────────────
  async softDelete(id: string, deletedBy: string): Promise<boolean> {
    const result = await this.update(id, {
      status: 'inactive',
      updatedBy: deletedBy,
    } as Partial<IUser>);
    return !!result;
  }

  // ─── List users with role-based filtering ────────────────────────────────────
  async findAll(
    query: PaginationQuery & {
      departmentFilter?: string;
      userFilter?: string;
    }
  ): Promise<{ data: IUser[]; total: number }> {
    const {
      page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc',
      status, departmentId, roleId, departmentFilter, userFilter,
    } = query;

    const conn = await getDbConnection(this.dbType);
    const offset = (page - 1) * limit;

    if (this.dbType === 'mongodb') {
      const { collections } = conn as { collections: import('../schemas/mongo.schema').MongoCollections };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const filter: Record<string, any> = {};

      if (userFilter) filter.id = userFilter;
      else if (departmentFilter && departmentFilter !== 'all') filter.departmentId = departmentFilter;
      if (status) filter.status = status;
      if (departmentId) filter.departmentId = departmentId;
      if (roleId) filter.roleId = roleId;
      if (search) {
        filter.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { username: { $regex: search, $options: 'i' } },
        ];
      }

      const [data, total] = await Promise.all([
        collections.users.find(filter).skip(offset).limit(limit).sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 }).toArray(),
        collections.users.countDocuments(filter),
      ]);

      return { data: data as unknown as IUser[], total };
    }

    // SQL databases
    const { db } = conn as { db: ReturnType<typeof import('drizzle-orm/node-postgres').drizzle> };
    const dbQuery = (db as any);
    // Build where conditions
    const conditions = [];
    if (userFilter) conditions.push(eq(users.id, userFilter));
    else if (departmentFilter && departmentFilter !== 'all') conditions.push(eq(users.departmentId, departmentFilter));
    if (status) conditions.push(eq(users.status, status));
    if (departmentId) conditions.push(eq(users.departmentId, departmentId));
    if (roleId) conditions.push(eq(users.roleId, roleId));
    if (search) {
      conditions.push(or(
        ilike(users.firstName, `%${search}%`),
        ilike(users.lastName, `%${search}%`),
        ilike(users.email, `%${search}%`),
        ilike(users.username, `%${search}%`)
      )!);
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, countResult] = await Promise.all([
      (dbQuery as ReturnType<typeof import('drizzle-orm/node-postgres').drizzle>)
        .select()
        .from(users)
        .leftJoin(roles, eq(users.roleId, roles.id))
        .leftJoin(departments, eq(users.departmentId, departments.id))
        .leftJoin(designations, eq(users.designationId, designations.id))
        .where(where)
        .limit(limit)
        .offset(offset)
        .orderBy(sortOrder === 'desc' ? desc(users.createdAt) : users.createdAt),
      (dbQuery as ReturnType<typeof import('drizzle-orm/node-postgres').drizzle>)
        .select({ count: count() })
        .from(users)
        .where(where),
    ]);

    return { data: data as unknown as IUser[], total: Number((countResult as Array<{ count: number }>)[0]?.count || 0) };
  }

  // ─── Increment failed login attempts ─────────────────────────────────────────
  async incrementFailedLogins(id: string): Promise<number> {
    const conn = await getDbConnection(this.dbType);

    if (this.dbType === 'mongodb') {
      const { collections } = conn as { collections: import('../schemas/mongo.schema').MongoCollections };
      const result = await collections.users.findOneAndUpdate(
        { id },
        { $inc: { failedLoginAttempts: 1 }, $set: { updatedAt: new Date() } },
        { returnDocument: 'after' }
      );
      return result?.failedLoginAttempts || 0;
    }

    const { db } = conn as { db: ReturnType<typeof import('drizzle-orm/node-postgres').drizzle> };
    const result = await (db as ReturnType<typeof import('drizzle-orm/node-postgres').drizzle>)
      .update(users)
      .set({
        failedLoginAttempts: sql`${users.failedLoginAttempts} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning({ failedLoginAttempts: users.failedLoginAttempts });
    return (result as Array<{ failedLoginAttempts: number }>)[0]?.failedLoginAttempts || 0;
  }

  // ─── Reset failed logins ──────────────────────────────────────────────────────
  async resetFailedLogins(id: string): Promise<void> {
    await this.update(id, {
      failedLoginAttempts: 0,
      lockUntil: undefined,
    } as Partial<IUser>);
  }
}
