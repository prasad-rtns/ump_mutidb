import { v4 as uuidv4 } from 'uuid';
import type { Collection } from 'mongodb';
import { IUserDAL } from '../interfaces/user.dal.interface';
import { IUser, CreateUserDTO, UpdateUserDTO, UserFilter } from '../../modules/user/user.types';
import { PaginatedResult } from '@rtns/core';
import { MongoCollections, MongoUser } from '../../schemas/mongo.schema';

export class MongoUserDAL implements IUserDAL {
  private col: Collection;

  constructor(private readonly collections: MongoCollections) {
    this.col = collections.users as unknown as Collection;
  }

  async findById(id: string): Promise<IUser | null> {
    const doc = await this.collections.users.findOne({ id });
    return doc ? this.mapUser(doc) : null;
  }

  async findByIdWithRelations(id: string): Promise<IUser | null> {
    const user = await this.collections.users.findOne({ id });
    if (!user) return null;
    return this.withRelations(user);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    const doc = await this.collections.users.findOne({ email: email.toLowerCase() });
    return doc ? this.mapUser(doc) : null;
  }

  async findByUsername(username: string): Promise<IUser | null> {
    const doc = await this.collections.users.findOne({ username });
    return doc ? this.mapUser(doc) : null;
  }

  async findByEmailOrUsername(identifier: string): Promise<IUser | null> {
    const doc = await this.collections.users.findOne({
      $or: [{ email: identifier.toLowerCase() }, { username: identifier }],
    });
    return doc ? this.mapUser(doc) : null;
  }

  async findAll(opts: UserFilter): Promise<PaginatedResult<IUser>> {
    return this.findFiltered(opts);
  }

  async findFiltered(filter: UserFilter): Promise<PaginatedResult<IUser>> {
    const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc',
      status, departmentId, roleId, companyId, userCategory, departmentFilter, userFilter } = filter;

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
    if (companyId)    query.companyId = companyId;
    if (userCategory) query.userCategory = userCategory;
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
    const usersWithRelations = await Promise.all(data.map(user => this.withRelations(user)));
    return { data: usersWithRelations, total };
  }

  async create(data: CreateUserDTO): Promise<IUser> {
    const now = new Date();
    const doc = {
      id: uuidv4(),
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
      status: 'active' as const,
      isEmailVerified: data.isEmailVerified ?? false,
      failedLoginAttempts: 0,
      twoFactorEnabled: data.twoFactorEnabled ?? false,
      createdBy: data.createdBy ?? null,
      updatedBy: null,
      createdAt: now,
      updatedAt: now,
    };
    await this.collections.users.insertOne(doc);
    return doc as unknown as IUser;
  }

  async update(id: string, data: UpdateUserDTO): Promise<IUser | null> {
    const result = await this.collections.users.findOneAndUpdate(
      { id },
      { $set: { ...(data as any), updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    return result ? this.mapUser(result) : null;
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
      { $set: { failedLoginAttempts: 0, lockUntil: null, updatedAt: new Date() } }
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

  async changeStatus(id: string, status: IUser['status'], updatedBy: string): Promise<boolean> {
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
    if (filter.roleId) query.roleId = filter.roleId;
    if (filter.companyId) query.companyId = filter.companyId;
    if (filter.userCategory) query.userCategory = filter.userCategory;
    return this.collections.users.countDocuments(query);
  }

  private mapUser(user: MongoUser): IUser {
    return {
      ...user,
      phone: user.phone ?? null,
      avatar: user.avatar ?? null,
      companyId: user.companyId ?? null,
      userCategory: user.userCategory ?? 'internal',
      emailVerificationToken: user.emailVerificationToken ?? null,
      passwordResetToken: user.passwordResetToken ?? null,
      passwordResetExpires: user.passwordResetExpires ?? null,
      lockUntil: user.lockUntil ?? null,
      twoFactorSecret: user.twoFactorSecret ?? null,
      lastLoginAt: user.lastLoginAt ?? null,
      lastLoginIp: user.lastLoginIp ?? null,
      createdBy: user.createdBy ?? null,
      updatedBy: user.updatedBy ?? null,
    } as unknown as IUser;
  }

  private async withRelations(user: MongoUser): Promise<IUser> {
    const [role, company, dept, desig] = await Promise.all([
      this.collections.roles.findOne({ id: user.roleId }),
      user.companyId ? this.collections.companies.findOne({ id: user.companyId }) : Promise.resolve(null),
      this.collections.departments.findOne({ id: user.departmentId }),
      this.collections.designations.findOne({ id: user.designationId }),
    ]);

    return {
      ...this.mapUser(user),
      role: role ?? undefined,
      company: company ?? undefined,
      department: dept ?? undefined,
      designation: desig ?? undefined,
    } as unknown as IUser;
  }
}
