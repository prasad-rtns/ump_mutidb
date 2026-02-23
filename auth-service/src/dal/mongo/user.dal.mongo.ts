import { v4 as uuidv4 } from 'uuid';
import type { Collection } from 'mongodb';
import { IUserDAL } from '../interfaces/user.dal.interface';
import { User, CreateUserDTO, UpdateUserDTO, UserFilter } from '../../types';
import { PaginatedResult } from '@prasad-rtns/shared';
import { MongoCollections } from '../../schemas/mongo.schema';

export class MongoUserDAL implements IUserDAL {
  private col: Collection;

  constructor(private readonly collections: MongoCollections) {
    this.col = collections.users as unknown as Collection;
  }

  async findById(id: string): Promise<User | null> {
    const doc = await this.collections.users.findOne({ id });
    return doc as unknown as User | null;
  }

  async findByIdWithRelations(id: string): Promise<User | null> {
    const user = await this.collections.users.findOne({ id });
    if (!user) return null;
    const [role, dept, desig] = await Promise.all([
      this.collections.roles.findOne({ id: user.roleId }),
      this.collections.departments.findOne({ id: user.departmentId }),
      this.collections.designations.findOne({ id: user.designationId }),
    ]);
    return { ...user, role: role ?? undefined, department: dept ?? undefined, designation: desig ?? undefined } as unknown as User;
  }

  async findByEmail(email: string): Promise<User | null> {
    const doc = await this.collections.users.findOne({ email: email.toLowerCase() });
    return doc as unknown as User | null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const doc = await this.collections.users.findOne({ username });
    return doc as unknown as User | null;
  }

  async findByEmailOrUsername(identifier: string): Promise<User | null> {
    const doc = await this.collections.users.findOne({
      $or: [{ email: identifier.toLowerCase() }, { username: identifier }],
    });
    return doc as unknown as User | null;
  }

  async findAll(opts: UserFilter): Promise<PaginatedResult<User>> {
    return this.findFiltered(opts);
  }

  async findFiltered(filter: UserFilter): Promise<PaginatedResult<User>> {
    const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc',
      status, departmentId, roleId, departmentFilter, userFilter } = filter;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = {};
    if (userFilter) {
      query.id = userFilter;
    } else if (departmentFilter && departmentFilter !== 'all') {
      query.departmentId = departmentFilter;
    }
    if (status)       query.status = status;
    if (departmentId) query.departmentId = departmentId;
    if (roleId)       query.roleId = roleId;
    if (search) {
      query.$or = [
        { firstName:  { $regex: search, $options: 'i' } },
        { lastName:   { $regex: search, $options: 'i' } },
        { email:      { $regex: search, $options: 'i' } },
        { username:   { $regex: search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.collections.users
        .find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .toArray(),
      this.collections.users.countDocuments(query),
    ]);
    return { data: data as unknown as User[], total };
  }

  async create(data: CreateUserDTO): Promise<User> {
    const now = new Date();
    const doc = {
      id: uuidv4(), ...(data as any),
      status: 'active' as const,
      isEmailVerified: false,
      failedLoginAttempts: 0,
      twoFactorEnabled: false,
      createdAt: now, updatedAt: now,
    };
    await this.collections.users.insertOne(doc);
    return doc as unknown as User;
  }

  async update(id: string, data: UpdateUserDTO): Promise<User | null> {
    const result = await this.collections.users.findOneAndUpdate(
      { id },
      { $set: { ...(data as any), updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    return result as unknown as User | null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.collections.users.deleteOne({ id });
    return result.deletedCount > 0;
  }

  async incrementFailedLogins(id: string): Promise<number> {
    const result = await this.collections.users.findOneAndUpdate(
      { id },
      { $inc: { failedLoginAttempts: 1 }, $set: { updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    return result?.failedLoginAttempts ?? 0;
  }

  async resetFailedLogins(id: string): Promise<void> {
    await this.collections.users.updateOne(
      { id },
      { $set: { failedLoginAttempts: 0, lockUntil: undefined, updatedAt: new Date() } }
    );
  }

  async lockAccount(id: string, until: Date): Promise<void> {
    await this.collections.users.updateOne(
      { id },
      { $set: { lockUntil: until, updatedAt: new Date() } }
    );
  }

  async updateLastLogin(id: string, ip: string): Promise<void> {
    await this.collections.users.updateOne(
      { id },
      { $set: { lastLoginAt: new Date(), lastLoginIp: ip, updatedAt: new Date() } }
    );
  }

  async changeStatus(id: string, status: User['status'], updatedBy: string): Promise<boolean> {
    const result = await this.collections.users.updateOne(
      { id },
      { $set: { status, updatedBy, updatedAt: new Date() } }
    );
    return result.modifiedCount > 0;
  }

  async softDelete(id: string, deletedBy: string): Promise<boolean> {
    return this.changeStatus(id, 'inactive', deletedBy);
  }

  async countByFilter(filter: Partial<UserFilter>): Promise<number> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = {};
    if (filter.userFilter) query.id = filter.userFilter;
    else if (filter.departmentFilter && filter.departmentFilter !== 'all') query.departmentId = filter.departmentFilter;
    if (filter.status) query.status = filter.status;
    if (filter.departmentId) query.departmentId = filter.departmentId;
    return this.collections.users.countDocuments(query);
  }
}
