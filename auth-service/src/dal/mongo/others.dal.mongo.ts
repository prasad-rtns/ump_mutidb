import { v4 as uuidv4 } from 'uuid';
import { MongoCollections } from '../../schemas/mongo.schema';
import { ISessionDAL } from '../interfaces/session.dal.interface';
import { IRoleDAL, IDepartmentDAL, IDesignationDAL } from '../interfaces/role-dept-desig.dal.interface';
import { IRole, IDepartment, IDesignation, CreateRoleDTO, UpdateRoleDTO, CreateDepartmentDTO, UpdateDepartmentDTO, CreateDesignationDTO, UpdateDesignationDTO } from '../../modules/master/master.types';
import { ISession, CreateSessionDTO } from '../../modules/common/common.types';
// ─── Session DAL ──────────────────────────────────────────────────────────────
export class MongoSessionDAL implements ISessionDAL {
  constructor(private readonly collections: MongoCollections) {}

  async create(data: CreateSessionDTO): Promise<ISession> {
    const doc = { id: uuidv4(), ...(data as any), isRevoked: false, createdAt: new Date() };
    await this.collections.sessions.insertOne(doc);
    return doc as unknown as ISession;
  }

  async findByRefreshToken(token: string): Promise<ISession | null> {
    const doc = await this.collections.sessions.findOne({ refreshToken: token, isRevoked: false });
    return doc as unknown as ISession | null;
  }

  async findActiveByUserId(userId: string): Promise<ISession[]> {
    const docs = await this.collections.sessions.find({ userId, isRevoked: false }).toArray();
    return docs as unknown as ISession[];
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

  async findAll(activeOnly = true): Promise<IRole[]> {
    const filter = activeOnly ? { isActive: true } : {};
    const docs = await this.collections.roles.find(filter).toArray();
    return docs as unknown as IRole[];
  }

  async findById(id: string): Promise<IRole | null> {
    const doc = await this.collections.roles.findOne({ id });
    return doc as unknown as IRole | null;
  }

  async findBySlug(slug: IRole['slug']): Promise<IRole | null> {
    const doc = await this.collections.roles.findOne({ slug });
    return doc as unknown as IRole | null;
  }

  async create(data: CreateRoleDTO): Promise<IRole> {
    const now = new Date();
    const doc = { id: uuidv4(), ...(data as any), permissions: data.permissions ?? [], isActive: true, createdAt: now, updatedAt: now };
    await this.collections.roles.insertOne(doc);
    return doc as unknown as IRole;
  }

  async update(id: string, data: UpdateRoleDTO): Promise<IRole | null> {
    const result = await this.collections.roles.findOneAndUpdate(
      { id }, { $set: { ...(data as any), updatedAt: new Date() } }, { returnDocument: 'after' }
    );
    return result as unknown as IRole | null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.collections.roles.updateOne({ id }, { $set: { isActive: false, updatedAt: new Date() } });
    return result.modifiedCount > 0;
  }
}

// ─── Department DAL ───────────────────────────────────────────────────────────
export class MongoDepartmentDAL implements IDepartmentDAL {
  constructor(private readonly collections: MongoCollections) {}

  async findAll(activeOnly = true): Promise<IDepartment[]> {
    const docs = await this.collections.departments.find(activeOnly ? { isActive: true } : {}).toArray();
    return docs as unknown as IDepartment[];
  }

  async findById(id: string): Promise<IDepartment | null> {
    const doc = await this.collections.departments.findOne({ id });
    return doc as unknown as IDepartment | null;
  }

  async findByCode(code: string): Promise<IDepartment | null> {
    const doc = await this.collections.departments.findOne({ code });
    return doc as unknown as IDepartment | null;
  }

  async findChildren(parentId: string): Promise<IDepartment[]> {
    const docs = await this.collections.departments.find({ parentId }).toArray();
    return docs as unknown as IDepartment[];
  }

  async create(data: CreateDepartmentDTO): Promise<IDepartment> {
    const now = new Date();
    const doc = { id: uuidv4(), ...(data as any), isActive: true, createdAt: now, updatedAt: now };
    await this.collections.departments.insertOne(doc);
    return doc as unknown as IDepartment;
  }

  async update(id: string, data: UpdateDepartmentDTO): Promise<IDepartment | null> {
    const result = await this.collections.departments.findOneAndUpdate(
      { id }, { $set: { ...(data as any), updatedAt: new Date() } }, { returnDocument: 'after' }
    );
    return result as unknown as IDepartment | null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.collections.departments.updateOne({ id }, { $set: { isActive: false, updatedAt: new Date() } });
    return result.modifiedCount > 0;
  }
}

// ─── Designation DAL ──────────────────────────────────────────────────────────
export class MongoDesignationDAL implements IDesignationDAL {
  constructor(private readonly collections: MongoCollections) {}

  async findAll(activeOnly = true): Promise<IDesignation[]> {
    const docs = await this.collections.designations.find(activeOnly ? { isActive: true } : {}).toArray();
    return docs as unknown as IDesignation[];
  }

  async findByDepartment(departmentId: string): Promise<IDesignation[]> {
    const docs = await this.collections.designations.find({ departmentId, isActive: true }).toArray();
    return docs as unknown as IDesignation[];
  }

  async findById(id: string): Promise<IDesignation | null> {
    const doc = await this.collections.designations.findOne({ id });
    return doc as unknown as IDesignation | null;
  }

  async findByCode(code: string): Promise<IDesignation | null> {
    const doc = await this.collections.designations.findOne({ code });
    return doc as unknown as IDesignation | null;
  }

  async create(data: CreateDesignationDTO): Promise<IDesignation> {
    const now = new Date();
    const doc = { id: uuidv4(), ...(data as any), level: data.level ?? 1, isActive: true, createdAt: now, updatedAt: now };
    await this.collections.designations.insertOne(doc);
    return doc as unknown as IDesignation;
  }

  async update(id: string, data: UpdateDesignationDTO): Promise<IDesignation | null> {
    const result = await this.collections.designations.findOneAndUpdate(
      { id }, { $set: { ...(data as any), updatedAt: new Date() } }, { returnDocument: 'after' }
    );
    return result as unknown as IDesignation | null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.collections.designations.updateOne({ id }, { $set: { isActive: false, updatedAt: new Date() } });
    return result.modifiedCount > 0;
  }
}
