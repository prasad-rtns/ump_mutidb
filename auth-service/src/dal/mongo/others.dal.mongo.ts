import { v4 as uuidv4 } from 'uuid';
import { MongoCollections } from '../../schemas/mongo.schema';
import { ISessionDAL } from '../interfaces/session.dal.interface';
import { IRoleDAL, IDepartmentDAL, IDesignationDAL } from '../interfaces/role-dept-desig.dal.interface';
import { Session, Role, Department, Designation, CreateSessionDTO, CreateRoleDTO, UpdateRoleDTO, CreateDepartmentDTO, UpdateDepartmentDTO, CreateDesignationDTO, UpdateDesignationDTO } from '../../types';

// ─── Session DAL ──────────────────────────────────────────────────────────────
export class MongoSessionDAL implements ISessionDAL {
  constructor(private readonly collections: MongoCollections) {}

  async create(data: CreateSessionDTO): Promise<Session> {
    const doc = { id: uuidv4(), ...(data as any), isRevoked: false, createdAt: new Date() };
    await this.collections.sessions.insertOne(doc);
    return doc as unknown as Session;
  }

  async findByRefreshToken(token: string): Promise<Session | null> {
    const doc = await this.collections.sessions.findOne({ refreshToken: token, isRevoked: false });
    return doc as unknown as Session | null;
  }

  async findActiveByUserId(userId: string): Promise<Session[]> {
    const docs = await this.collections.sessions.find({ userId, isRevoked: false }).toArray();
    return docs as unknown as Session[];
  }

  async revokeByToken(token: string): Promise<void> {
    await this.collections.sessions.updateOne({ refreshToken: token }, { $set: { isRevoked: true } });
  }

  async revokeAllByUserId(userId: string): Promise<void> {
    await this.collections.sessions.updateMany({ userId }, { $set: { isRevoked: true } });
  }

  async deleteExpired(): Promise<number> {
    const result = await this.collections.sessions.deleteMany({ expiresAt: { $lt: new Date() } });
    return result.deletedCount;
  }
}

// ─── Role DAL ─────────────────────────────────────────────────────────────────
export class MongoRoleDAL implements IRoleDAL {
  constructor(private readonly collections: MongoCollections) {}

  async findAll(activeOnly = true): Promise<Role[]> {
    const filter = activeOnly ? { isActive: true } : {};
    const docs = await this.collections.roles.find(filter).toArray();
    return docs as unknown as Role[];
  }

  async findById(id: string): Promise<Role | null> {
    const doc = await this.collections.roles.findOne({ id });
    return doc as unknown as Role | null;
  }

  async findBySlug(slug: Role['slug']): Promise<Role | null> {
    const doc = await this.collections.roles.findOne({ slug });
    return doc as unknown as Role | null;
  }

  async create(data: CreateRoleDTO): Promise<Role> {
    const now = new Date();
    const doc = { id: uuidv4(), ...(data as any), permissions: data.permissions ?? [], isActive: true, createdAt: now, updatedAt: now };
    await this.collections.roles.insertOne(doc);
    return doc as unknown as Role;
  }

  async update(id: string, data: UpdateRoleDTO): Promise<Role | null> {
    const result = await this.collections.roles.findOneAndUpdate(
      { id }, { $set: { ...(data as any), updatedAt: new Date() } }, { returnDocument: 'after' }
    );
    return result as unknown as Role | null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.collections.roles.updateOne({ id }, { $set: { isActive: false, updatedAt: new Date() } });
    return result.modifiedCount > 0;
  }
}

// ─── Department DAL ───────────────────────────────────────────────────────────
export class MongoDepartmentDAL implements IDepartmentDAL {
  constructor(private readonly collections: MongoCollections) {}

  async findAll(activeOnly = true): Promise<Department[]> {
    const docs = await this.collections.departments.find(activeOnly ? { isActive: true } : {}).toArray();
    return docs as unknown as Department[];
  }

  async findById(id: string): Promise<Department | null> {
    const doc = await this.collections.departments.findOne({ id });
    return doc as unknown as Department | null;
  }

  async findByCode(code: string): Promise<Department | null> {
    const doc = await this.collections.departments.findOne({ code });
    return doc as unknown as Department | null;
  }

  async findChildren(parentId: string): Promise<Department[]> {
    const docs = await this.collections.departments.find({ parentId }).toArray();
    return docs as unknown as Department[];
  }

  async create(data: CreateDepartmentDTO): Promise<Department> {
    const now = new Date();
    const doc = { id: uuidv4(), ...(data as any), isActive: true, createdAt: now, updatedAt: now };
    await this.collections.departments.insertOne(doc);
    return doc as unknown as Department;
  }

  async update(id: string, data: UpdateDepartmentDTO): Promise<Department | null> {
    const result = await this.collections.departments.findOneAndUpdate(
      { id }, { $set: { ...(data as any), updatedAt: new Date() } }, { returnDocument: 'after' }
    );
    return result as unknown as Department | null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.collections.departments.updateOne({ id }, { $set: { isActive: false, updatedAt: new Date() } });
    return result.modifiedCount > 0;
  }
}

// ─── Designation DAL ──────────────────────────────────────────────────────────
export class MongoDesignationDAL implements IDesignationDAL {
  constructor(private readonly collections: MongoCollections) {}

  async findAll(activeOnly = true): Promise<Designation[]> {
    const docs = await this.collections.designations.find(activeOnly ? { isActive: true } : {}).toArray();
    return docs as unknown as Designation[];
  }

  async findByDepartment(departmentId: string): Promise<Designation[]> {
    const docs = await this.collections.designations.find({ departmentId, isActive: true }).toArray();
    return docs as unknown as Designation[];
  }

  async findById(id: string): Promise<Designation | null> {
    const doc = await this.collections.designations.findOne({ id });
    return doc as unknown as Designation | null;
  }

  async findByCode(code: string): Promise<Designation | null> {
    const doc = await this.collections.designations.findOne({ code });
    return doc as unknown as Designation | null;
  }

  async create(data: CreateDesignationDTO): Promise<Designation> {
    const now = new Date();
    const doc = { id: uuidv4(), ...(data as any), level: data.level ?? 1, isActive: true, createdAt: now, updatedAt: now };
    await this.collections.designations.insertOne(doc);
    return doc as unknown as Designation;
  }

  async update(id: string, data: UpdateDesignationDTO): Promise<Designation | null> {
    const result = await this.collections.designations.findOneAndUpdate(
      { id }, { $set: { ...(data as any), updatedAt: new Date() } }, { returnDocument: 'after' }
    );
    return result as unknown as Designation | null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.collections.designations.updateOne({ id }, { $set: { isActive: false, updatedAt: new Date() } });
    return result.modifiedCount > 0;
  }
}
