import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, like, isNull } from 'drizzle-orm';
import {
  countries,
  states,
  cities,
  categories,
  tags,
  documentTypes,
  systemSettings,
  serviceTypes
} from '../../schemas/mysql.schema';

import type {
  ICountryDAL,
  IStateDAL,
  ICityDAL,
  ICategoryDAL,
  ITagDAL,
  IDocumentTypeDAL,
  ISettingDAL,
  IServiceTypeDAL
} from '../interfaces/master.dal.interfaces';

import type {
  Country,
  State,
  City,
  Category,
  Tag,
  DocumentType,
  SystemSetting,
  ServiceType,
  CreateCountryDTO,
  UpdateCountryDTO,
  CreateStateDTO,
  CreateCityDTO,
  CreateCategoryDTO,
  UpdateCategoryDTO,
  CreateTagDTO,
  CreateDocumentTypeDTO,
  UpsertSettingDTO,
  CreateServiceTypeDTO,
  UpdateServiceTypeDTO
} from '../../modules/coredata/coredata.types';

import { randomUUID } from 'crypto';

const now = () => new Date();

export class MysqlCountryDAL implements ICountryDAL {

  constructor(private db: MySql2Database<any>) {}

  async findAll(activeOnly = true): Promise<Country[]> {
    return this.db
      .select()
      .from(countries)
      .where(activeOnly ? eq(countries.isActive, true) : undefined);
  }

  async findById(id: string): Promise<Country | null> {
    const r = await this.db
      .select()
      .from(countries)
      .where(eq(countries.id, id))
      .limit(1);

    return r[0] ?? null;
  }

  async findByCode(code: string): Promise<Country | null> {
    const r = await this.db
      .select()
      .from(countries)
      .where(eq(countries.code, code))
      .limit(1);

    return r[0] ?? null;
  }

  async create(data: CreateCountryDTO): Promise<Country> {

    const doc: Country = {
      id: randomUUID(),

      name: data.name,
      code: data.code,

      dialCode: data.dialCode ?? null,
      flag: data.flag ?? null,
      currency: data.currency ?? null,
      currencySymbol: data.currencySymbol ?? null,

      isActive: true,
      createdAt: now(),
      updatedAt: now(),
    };

    await this.db.insert(countries).values(doc);

    return doc;
  }

  async update(id: string, data: UpdateCountryDTO): Promise<Country | null> {

    const updateData = {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.code !== undefined && { code: data.code }),
      ...(data.dialCode !== undefined && { dialCode: data.dialCode ?? null }),
      ...(data.flag !== undefined && { flag: data.flag ?? null }),
      ...(data.currency !== undefined && { currency: data.currency ?? null }),
      ...(data.currencySymbol !== undefined && { currencySymbol: data.currencySymbol ?? null }),
      updatedAt: now(),
    };

    await this.db
      .update(countries)
      .set(updateData)
      .where(eq(countries.id, id));

    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {

    const r = await this.db
      .update(countries)
      .set({
        isActive: false,
        updatedAt: now()
      })
      .where(eq(countries.id, id));

    return true;
  }
}
/* ───────────────── STATE ───────────────── */

export class MysqlStateDAL implements IStateDAL {

  constructor(private db: MySql2Database<any>) {}

  async findAll(activeOnly = true): Promise<State[]> {
    return this.db
      .select()
      .from(states)
      .where(activeOnly ? eq(states.isActive, true) : undefined);
  }

  async findByCountry(countryId: string, activeOnly = true): Promise<State[]> {
    return this.db
      .select()
      .from(states)
      .where(
        and(
          eq(states.countryId, countryId),
          activeOnly ? eq(states.isActive, true) : undefined
        )
      );
  }

  async findById(id: string): Promise<State | null> {
    const r = await this.db
      .select()
      .from(states)
      .where(eq(states.id, id))
      .limit(1);

    return r[0] ?? null;
  }

  async create(data: CreateStateDTO): Promise<State> {

    const doc: State = {
      id: randomUUID(),
      name: data.name,
      code: data.code,
      countryId: data.countryId,
      isActive: true,
      createdAt: now(),
      updatedAt: now(),
    };

    await this.db.insert(states).values(doc);
    return doc;
  }

  async delete(id: string): Promise<boolean> {
    await this.db
      .update(states)
      .set({ isActive: false, updatedAt: now() })
      .where(eq(states.id, id));

    return true;
  }
}

/* ───────────────── CITY ───────────────── */

export class MysqlCityDAL implements ICityDAL {

  constructor(private db: MySql2Database<any>) {}

  async findByState(stateId: string): Promise<City[]> {
    return this.db
      .select()
      .from(cities)
      .where(
        and(
          eq(cities.stateId, stateId),
          eq(cities.isActive, true)
        )
      );
  }

  async search(query: string, stateId?: string): Promise<City[]> {

    const baseCondition = like(cities.name, `%${query}%`);

    return this.db
      .select()
      .from(cities)
      .where(
        stateId
          ? and(baseCondition, eq(cities.stateId, stateId))
          : baseCondition
      )
      .limit(100);
  }

  async findById(id: string): Promise<City | null> {
    const r = await this.db
      .select()
      .from(cities)
      .where(eq(cities.id, id))
      .limit(1);

    return r[0] ?? null;
  }

  async create(data: CreateCityDTO): Promise<City> {

    const doc: City = {
      id: randomUUID(),
      name: data.name,
      stateId: data.stateId,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      isActive: true,
      createdAt: now(),
      updatedAt: now(),
    };

    await this.db.insert(cities).values(doc);
    return doc;
  }

  async delete(id: string): Promise<boolean> {
    await this.db
      .update(cities)
      .set({ isActive: false, updatedAt: now() })
      .where(eq(cities.id, id));

    return true;
  }
}

/* ───────────────── CATEGORY ───────────────── */

export class MysqlCategoryDAL implements ICategoryDAL {

  constructor(private db: MySql2Database<any>) {}

  async findAll(activeOnly = true): Promise<Category[]> {
    return this.db
      .select()
      .from(categories)
      .where(activeOnly ? eq(categories.isActive, true) : undefined);
  }

  async findByParent(parentId: string | null): Promise<Category[]> {
    return this.db
      .select()
      .from(categories)
      .where(
      parentId === null
        ? isNull(categories.parentId)
        : eq(categories.parentId, parentId)
    );
  }

  async findById(id: string): Promise<Category | null> {
    const r = await this.db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);

    return r[0] ?? null;
  }

  async findByCode(code: string): Promise<Category | null> {
    const r = await this.db
      .select()
      .from(categories)
      .where(eq(categories.code, code))
      .limit(1);

    return r[0] ?? null;
  }

  async search(query: string): Promise<Category[]> {
    return this.db
      .select()
      .from(categories)
      .where(like(categories.name, `%${query}%`));
  }

  async create(data: CreateCategoryDTO): Promise<Category> {

    const doc: Category = {
      id: randomUUID(),
      name: data.name,
      code: data.code,
      parentId: data.parentId ?? null,
      description: data.description ?? null,
      icon: data.icon ?? null,
      metadata: data.metadata ?? null,
      sortOrder: data.sortOrder ?? 0,
      isActive: true,
      createdAt: now(),
      updatedAt: now(),
    };

    await this.db.insert(categories).values(doc);
    return doc;
  }

  async update(id: string, data: UpdateCategoryDTO): Promise<Category | null> {

    const updateData = {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.code !== undefined && { code: data.code }),
      ...(data.parentId !== undefined && { parentId: data.parentId ?? null }),
      ...(data.description !== undefined && { description: data.description ?? null }),
      ...(data.icon !== undefined && { icon: data.icon ?? null }),
      ...(data.metadata !== undefined && { metadata: data.metadata ?? null }),
      ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      updatedAt: now(),
    };

    await this.db
      .update(categories)
      .set(updateData)
      .where(eq(categories.id, id));

    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    await this.db
      .update(categories)
      .set({ isActive: false, updatedAt: now() })
      .where(eq(categories.id, id));

    return true;
  }
}

/* ───────────────── TAG ───────────────── */

export class MysqlTagDAL implements ITagDAL {

  constructor(private db: MySql2Database<any>) {}

  async findAll(activeOnly = true): Promise<Tag[]> {
    return this.db
      .select()
      .from(tags)
      .where(activeOnly ? eq(tags.isActive, true) : undefined);
  }

  async findById(id: string): Promise<Tag | null> {
    const r = await this.db
      .select()
      .from(tags)
      .where(eq(tags.id, id))
      .limit(1);

    return r[0] ?? null;
  }

  async findBySlug(slug: string): Promise<Tag | null> {
    const r = await this.db
      .select()
      .from(tags)
      .where(eq(tags.slug, slug))
      .limit(1);

    return r[0] ?? null;
  }

  async create(data: CreateTagDTO): Promise<Tag> {

    const slug = data.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    const doc: Tag = {
      id: randomUUID(),
      name: data.name,
      slug,
      color: data.color ?? null,
      isActive: true,
      createdAt: now(),
      updatedAt: now(),
    };

    await this.db.insert(tags).values(doc);
    return doc;
  }

  async delete(id: string): Promise<boolean> {
    await this.db
      .update(tags)
      .set({ isActive: false, updatedAt: now() })
      .where(eq(tags.id, id));

    return true;
  }
}

/* ───────────────── DOCUMENT TYPE ───────────────── */

export class MysqlDocumentTypeDAL implements IDocumentTypeDAL {

  constructor(private db: MySql2Database<any>) {}

  async findAll(activeOnly = true): Promise<DocumentType[]> {
    return this.db
      .select()
      .from(documentTypes)
      .where(activeOnly ? eq(documentTypes.isActive, true) : undefined);
  }

  async findById(id: string): Promise<DocumentType | null> {
    const r = await this.db
      .select()
      .from(documentTypes)
      .where(eq(documentTypes.id, id))
      .limit(1);

    return r[0] ?? null;
  }

  async findByCode(code: string): Promise<DocumentType | null> {
    const r = await this.db
      .select()
      .from(documentTypes)
      .where(eq(documentTypes.code, code))
      .limit(1);

    return r[0] ?? null;
  }

  async create(data: CreateDocumentTypeDTO): Promise<DocumentType> {

    const doc: DocumentType = {
      id: randomUUID(),
      name: data.name,
      code: data.code,
      description: data.description ?? null,
      allowedMimeTypes: data.allowedMimeTypes ?? [],
      maxSizeMb: data.maxSizeMb ?? 10,
      isRequired: data.isRequired ?? false,
      isActive: true,
      createdAt: now(),
      updatedAt: now(),
    };

    await this.db.insert(documentTypes).values(doc);
    return doc;
  }

  async delete(id: string): Promise<boolean> {
    await this.db
      .update(documentTypes)
      .set({ isActive: false, updatedAt: now() })
      .where(eq(documentTypes.id, id));

    return true;
  }
}

/* ───────────────── SETTINGS ───────────────── */

export class MysqlSettingDAL implements ISettingDAL {

  constructor(private db: MySql2Database<any>) {}

  async findAll(): Promise<SystemSetting[]> {
    return this.db.select().from(systemSettings);
  }

  async findPublic(): Promise<SystemSetting[]> {
    return this.db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.isPublic, true));
  }

  async findByKey(key: string): Promise<SystemSetting | null> {
    const r = await this.db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, key))
      .limit(1);

    return r[0] ?? null;
  }

  async upsert(data: UpsertSettingDTO): Promise<SystemSetting> {

    const existing = await this.findByKey(data.key);

    if (existing) {
      await this.db
        .update(systemSettings)
        .set({
          value: data.value,
          description: data.description ?? null,
          type: data.type ?? 'string',
          category: data.category ?? 'general',
          isPublic: data.isPublic ?? false,
          updatedAt: now(),
        })
        .where(eq(systemSettings.key, data.key));

      return (await this.findByKey(data.key))!;
    }

    const doc: SystemSetting = {
      id: randomUUID(),
      key: data.key,
      value: data.value ?? null,
      description: data.description ?? null,
      type: data.type ?? 'string',
      category: data.category ?? 'general',
      isPublic: data.isPublic ?? false,
      createdAt: now(),
      updatedAt: now(),
    };

    await this.db.insert(systemSettings).values(doc);

    return doc;
  }

  async delete(key: string): Promise<boolean> {
    await this.db
      .delete(systemSettings)
      .where(eq(systemSettings.key, key));

    return true;
  }
}

// ─── Service Type DAL ─────────────────────────────────────────────────────────
export class MysqlServiceTypeDAL implements IServiceTypeDAL {
  constructor(private db: MySql2Database<any>) {}

  async findAll(activeOnly = true): Promise<ServiceType[]> {
    const rows = activeOnly
      ? await this.db.select().from(serviceTypes).where(eq(serviceTypes.isActive, true))
      : await this.db.select().from(serviceTypes);
    return rows as ServiceType[];
  }

  async findById(id: string): Promise<ServiceType | null> {
    const r = await this.db.select().from(serviceTypes).where(eq(serviceTypes.id, id)).limit(1);
    return (r[0] as ServiceType) ?? null;
  }

  async findByCode(code: string): Promise<ServiceType | null> {
    const r = await this.db.select().from(serviceTypes).where(eq(serviceTypes.code, code)).limit(1);
    return (r[0] as ServiceType) ?? null;
  }

  async create(data: CreateServiceTypeDTO): Promise<ServiceType> {
    const id = randomUUID();
    const now = new Date();
    await this.db.insert(serviceTypes).values({ id, name: data.name, code: data.code, description: data.description ?? null, routeLink: data.routeLink ?? null, icon: data.icon ?? null, isActive: true, createdAt: now, updatedAt: now });
    return (await this.findById(id))!;
  }

  async update(id: string, data: UpdateServiceTypeDTO): Promise<ServiceType | null> {
    await this.db.update(serviceTypes).set({ ...(data as any), updatedAt: new Date() }).where(eq(serviceTypes.id, id));
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    await this.db.update(serviceTypes).set({ isActive: false, updatedAt: new Date() }).where(eq(serviceTypes.id, id));
    return true;
  }
}