import { asc, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { v4 as uuidv4 } from 'uuid';
import { companies, moduleMenus } from '../../schemas/pg.schema';
import { CreateCompanyOrUtilityDTO, CreateModuleMenuDTO, ICompanyOrUtility, IModuleMenu, UpdateCompanyOrUtilityDTO, UpdateModuleMenuDTO } from '../../modules/master/master.types';
import { ICompanyOrUtilityDAL, IModuleMenuDAL } from '../interfaces/rbms.dal.interface';

type PgDB = NodePgDatabase<Record<string, never>>;
const now = () => new Date();

export class PgCompanyOrUtilityDAL implements ICompanyOrUtilityDAL {
  constructor(private readonly db: PgDB) {}

  async findAll(activeOnly = true): Promise<ICompanyOrUtility[]> {
    const rows = await this.db.select().from(companies).where(activeOnly ? eq(companies.isActive, true) : undefined).orderBy(asc(companies.name));
    return rows as unknown as ICompanyOrUtility[];
  }

  async findById(id: string): Promise<ICompanyOrUtility | null> {
    const rows = await this.db.select().from(companies).where(eq(companies.id, id)).limit(1);
    return (rows[0] as unknown as ICompanyOrUtility) ?? null;
  }

  async findByCode(code: string): Promise<ICompanyOrUtility | null> {
    const rows = await this.db.select().from(companies).where(eq(companies.code, code)).limit(1);
    return (rows[0] as unknown as ICompanyOrUtility) ?? null;
  }

  async create(data: CreateCompanyOrUtilityDTO): Promise<ICompanyOrUtility> {
    const timestamp = now();
    const rows = await this.db.insert(companies).values({
      id: uuidv4(),
      name: data.name,
      code: data.code,
      type: data.type ?? 'company',
      description: data.description ?? null,
      isActive: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    }).returning();
    return rows[0] as unknown as ICompanyOrUtility;
  }

  async update(id: string, data: UpdateCompanyOrUtilityDTO): Promise<ICompanyOrUtility | null> {
    const rows = await this.db.update(companies).set({ ...(data as any), updatedAt: now() }).where(eq(companies.id, id)).returning();
    return (rows[0] as unknown as ICompanyOrUtility) ?? null;
  }

  async delete(id: string): Promise<boolean> {
    const rows = await this.db.update(companies).set({ isActive: false, updatedAt: now() }).where(eq(companies.id, id)).returning({ id: companies.id });
    return rows.length > 0;
  }
}

export class PgModuleMenuDAL implements IModuleMenuDAL {
  constructor(private readonly db: PgDB) {}

  async findAll(activeOnly = true): Promise<IModuleMenu[]> {
    const rows = await this.db.select().from(moduleMenus).where(activeOnly ? eq(moduleMenus.isActive, true) : undefined).orderBy(asc(moduleMenus.sortOrder), asc(moduleMenus.name));
    return rows as unknown as IModuleMenu[];
  }

  async findById(id: string): Promise<IModuleMenu | null> {
    const rows = await this.db.select().from(moduleMenus).where(eq(moduleMenus.id, id)).limit(1);
    return (rows[0] as unknown as IModuleMenu) ?? null;
  }

  async findByCode(code: string): Promise<IModuleMenu | null> {
    const rows = await this.db.select().from(moduleMenus).where(eq(moduleMenus.code, code)).limit(1);
    return (rows[0] as unknown as IModuleMenu) ?? null;
  }

  async create(data: CreateModuleMenuDTO): Promise<IModuleMenu> {
    const timestamp = now();
    const rows = await this.db.insert(moduleMenus).values({
      id: uuidv4(),
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
    }).returning();
    return rows[0] as unknown as IModuleMenu;
  }

  async update(id: string, data: UpdateModuleMenuDTO): Promise<IModuleMenu | null> {
    const rows = await this.db.update(moduleMenus).set({
      ...(data as any),
      parentId: data.parentId || null,
      icon: data.icon ?? null,
      updatedAt: now(),
    }).where(eq(moduleMenus.id, id)).returning();
    return (rows[0] as unknown as IModuleMenu) ?? null;
  }

  async delete(id: string): Promise<boolean> {
    const rows = await this.db.update(moduleMenus).set({ isActive: false, updatedAt: now() }).where(eq(moduleMenus.id, id)).returning({ id: moduleMenus.id });
    return rows.length > 0;
  }
}
