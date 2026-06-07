import { v4 as uuidv4 } from 'uuid';
import { MongoCollections } from '../../schemas/mongo.schema';
import { CreateCompanyOrUtilityDTO, CreateModuleMenuDTO, ICompanyOrUtility, IModuleMenu, UpdateCompanyOrUtilityDTO, UpdateModuleMenuDTO } from '../../modules/master/master.types';
import { ICompanyOrUtilityDAL, IModuleMenuDAL } from '../interfaces/rbms.dal.interface';

const stripId = <T>(doc: T | null): T | null => {
  if (!doc) return null;
  const { _id, ...rest } = doc as Record<string, unknown>;
  return rest as T;
};

export class MongoCompanyOrUtilityDAL implements ICompanyOrUtilityDAL {
  constructor(private readonly collections: MongoCollections) {}

  async findAll(activeOnly = true): Promise<ICompanyOrUtility[]> {
    const docs = await this.collections.companies.find(activeOnly ? { isActive: true } : {}).sort({ name: 1 }).toArray();
    return docs.map((doc) => stripId(doc)!) as unknown as ICompanyOrUtility[];
  }

  async findById(id: string): Promise<ICompanyOrUtility | null> {
    return stripId(await this.collections.companies.findOne({ id })) as unknown as ICompanyOrUtility | null;
  }

  async findByCode(code: string): Promise<ICompanyOrUtility | null> {
    return stripId(await this.collections.companies.findOne({ code })) as unknown as ICompanyOrUtility | null;
  }

  async create(data: CreateCompanyOrUtilityDTO): Promise<ICompanyOrUtility> {
    const now = new Date();
    const doc = { id: uuidv4(), ...data, type: data.type ?? 'company', isActive: true, createdAt: now, updatedAt: now };
    await this.collections.companies.insertOne(doc);
    return doc as ICompanyOrUtility;
  }

  async update(id: string, data: UpdateCompanyOrUtilityDTO): Promise<ICompanyOrUtility | null> {
    const result = await this.collections.companies.findOneAndUpdate(
      { id },
      { $set: { ...data, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    return stripId(result) as unknown as ICompanyOrUtility | null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.collections.companies.updateOne({ id }, { $set: { isActive: false, updatedAt: new Date() } });
    return result.modifiedCount > 0;
  }
}

export class MongoModuleMenuDAL implements IModuleMenuDAL {
  constructor(private readonly collections: MongoCollections) {}

  async findAll(activeOnly = true): Promise<IModuleMenu[]> {
    const docs = await this.collections.moduleMenus.find(activeOnly ? { isActive: true } : {}).sort({ sortOrder: 1, name: 1 }).toArray();
    return docs.map((doc) => stripId(doc)!) as unknown as IModuleMenu[];
  }

  async findById(id: string): Promise<IModuleMenu | null> {
    return stripId(await this.collections.moduleMenus.findOne({ id })) as unknown as IModuleMenu | null;
  }

  async findByCode(code: string): Promise<IModuleMenu | null> {
    return stripId(await this.collections.moduleMenus.findOne({ code })) as unknown as IModuleMenu | null;
  }

  async create(data: CreateModuleMenuDTO): Promise<IModuleMenu> {
    const now = new Date();
    const doc = {
      id: uuidv4(),
      ...data,
      parentId: data.parentId || undefined,
      moduleType: data.moduleType ?? 'admin',
      sortOrder: data.sortOrder ?? 0,
      permissions: data.permissions ?? [],
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    await this.collections.moduleMenus.insertOne(doc);
    return doc as IModuleMenu;
  }

  async update(id: string, data: UpdateModuleMenuDTO): Promise<IModuleMenu | null> {
    const update: Record<string, unknown> = { ...data, updatedAt: new Date() };
    if (data.parentId !== undefined) update.parentId = data.parentId || undefined;
    if (data.icon !== undefined) update.icon = data.icon || undefined;

    const result = await this.collections.moduleMenus.findOneAndUpdate(
      { id },
      { $set: update },
      { returnDocument: 'after' }
    );
    return stripId(result) as unknown as IModuleMenu | null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.collections.moduleMenus.updateOne({ id }, { $set: { isActive: false, updatedAt: new Date() } });
    return result.modifiedCount > 0;
  }
}
