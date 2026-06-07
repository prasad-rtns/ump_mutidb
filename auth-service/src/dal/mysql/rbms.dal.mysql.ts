import { asc, eq } from 'drizzle-orm';
import type { MySql2Database } from 'drizzle-orm/mysql2';
import { v4 as uuidv4 } from 'uuid';
import { companies, moduleMenus } from '../../schemas/mysql.schema';
import { CreateCompanyOrUtilityDTO, CreateModuleMenuDTO, ICompanyOrUtility, IModuleMenu, UpdateCompanyOrUtilityDTO, UpdateModuleMenuDTO } from '../../modules/master/master.types';
import { ICompanyOrUtilityDAL, IModuleMenuDAL } from '../interfaces/rbms.dal.interface';

type MysqlDB = MySql2Database<any>;
const now = () => new Date();

export class MysqlCompanyOrUtilityDAL implements ICompanyOrUtilityDAL {
  constructor(private readonly db: MysqlDB) {}

  async findAll(activeOnly = true): Promise<ICompanyOrUtility[]> {
    return this.db.select().from(companies).where(activeOnly ? eq(companies.isActive, true) : undefined).orderBy(asc(companies.name)) as Promise<ICompanyOrUtility[]>;
  }

  async findById(id: string): Promise<ICompanyOrUtility | null> {
    const rows = await this.db.select().from(companies).where(eq(companies.id, id)).limit(1);
    return (rows[0] as ICompanyOrUtility | undefined) ?? null;
  }

  async findByCode(code: string): Promise<ICompanyOrUtility | null> {
    const rows = await this.db.select().from(companies).where(eq(companies.code, code)).limit(1);
    return (rows[0] as ICompanyOrUtility | undefined) ?? null;
  }

  async create(data: CreateCompanyOrUtilityDTO): Promise<ICompanyOrUtility> {
    const id = uuidv4();
    const timestamp = now();
    await this.db.insert(companies).values({
      id,
      name: data.name,
      code: data.code,
      type: data.type ?? 'company',
      description: data.description ?? null,
      isActive: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    return (await this.findById(id))!;
  }

  async update(id: string, data: UpdateCompanyOrUtilityDTO): Promise<ICompanyOrUtility | null> {
    await this.db.update(companies).set({ ...data, updatedAt: now() }).where(eq(companies.id, id));
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    await this.db.update(companies).set({ isActive: false, updatedAt: now() }).where(eq(companies.id, id));
    return true;
  }
}

export class MysqlModuleMenuDAL implements IModuleMenuDAL {
  constructor(private readonly db: MysqlDB) {}

  async findAll(activeOnly = true): Promise<IModuleMenu[]> {
    return this.db.select().from(moduleMenus).where(activeOnly ? eq(moduleMenus.isActive, true) : undefined).orderBy(asc(moduleMenus.sortOrder), asc(moduleMenus.name)) as Promise<IModuleMenu[]>;
  }

  async findById(id: string): Promise<IModuleMenu | null> {
    const rows = await this.db.select().from(moduleMenus).where(eq(moduleMenus.id, id)).limit(1);
    return (rows[0] as IModuleMenu | undefined) ?? null;
  }

  async findByCode(code: string): Promise<IModuleMenu | null> {
    const rows = await this.db.select().from(moduleMenus).where(eq(moduleMenus.code, code)).limit(1);
    return (rows[0] as IModuleMenu | undefined) ?? null;
  }

  async create(data: CreateModuleMenuDTO): Promise<IModuleMenu> {
    const id = uuidv4();
    const timestamp = now();
    await this.db.insert(moduleMenus).values({
      id,
      name: data.name,
      code: data.code,
      route: data.route,
      icon: data.icon ?? null,
      parentId: data.parentId || null,
      sortOrder: data.sortOrder ?? 0,
      permissions: data.permissions ?? [],
      isActive: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    return (await this.findById(id))!;
  }

  async update(id: string, data: UpdateModuleMenuDTO): Promise<IModuleMenu | null> {
    await this.db.update(moduleMenus).set({
      ...data,
      parentId: data.parentId || null,
      icon: data.icon ?? null,
      updatedAt: now(),
    }).where(eq(moduleMenus.id, id));
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    await this.db.update(moduleMenus).set({ isActive: false, updatedAt: now() }).where(eq(moduleMenus.id, id));
    return true;
  }
}
