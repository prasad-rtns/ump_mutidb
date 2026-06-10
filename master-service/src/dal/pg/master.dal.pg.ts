import { eq, ilike, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { countries, states, cities, categories, tags, documentTypes, systemSettings, serviceTypes } from '../../schemas/pg.schema';
import { ICountryDAL, IStateDAL, ICityDAL, ICategoryDAL, ITagDAL, IDocumentTypeDAL, ISettingDAL, IServiceTypeDAL } from '../interfaces/master.dal.interfaces';
import type { Country, State, City, Category, Tag, DocumentType, SystemSetting, ServiceType, CreateCountryDTO, CreateStateDTO, CreateCityDTO, CreateCategoryDTO, CreateTagDTO, CreateDocumentTypeDTO, UpsertSettingDTO, UpdateCountryDTO, UpdateCategoryDTO, CreateServiceTypeDTO, UpdateServiceTypeDTO } from '../../modules/coredata/coredata.types';

type PgDB = NodePgDatabase<Record<string, never>>;
const now = () => new Date();
const nullableId = (value?: string | null) => value && value.trim() ? value : null;
const numericValue = (value: unknown, fallback = 0) => {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

// ─── Country DAL ──────────────────────────────────────────────────────────────
export class PgCountryDAL implements ICountryDAL {
  constructor(private db: PgDB) {}
  async findAll(activeOnly = true)  { return this.db.select().from(countries).where(activeOnly ? eq(countries.isActive, true) : undefined) as Promise<Country[]>; }
  async findById(id: string)        { const r = await this.db.select().from(countries).where(eq(countries.id, id)).limit(1); return (r[0] as Country) ?? null; }
  async findByCode(code: string)    { const r = await this.db.select().from(countries).where(eq(countries.code, code)).limit(1); return (r[0] as Country) ?? null; }
  async create(data: CreateCountryDTO) { const r = await this.db.insert(countries).values({ id: uuidv4(), ...(data as any), isActive: true, createdAt: now(), updatedAt: now() }).returning(); return r[0] as Country; }
  async update(id: string, data: UpdateCountryDTO) { const r = await this.db.update(countries).set({ ...(data as any), updatedAt: now() }).where(eq(countries.id, id)).returning(); return (r[0] as Country) ?? null; }
  async delete(id: string) { const r = await this.db.update(countries).set({ isActive: false, updatedAt: now() }).where(eq(countries.id, id)).returning({ id: countries.id }); return r.length > 0; }
}

// ─── State DAL ────────────────────────────────────────────────────────────────
export class PgStateDAL implements IStateDAL {
  constructor(private db: PgDB) {}
  async findAll(activeOnly = true)  { return this.db.select().from(states).where(activeOnly ? eq(states.isActive, true) : undefined) as Promise<State[]>; }
  async findByCountry(countryId: string, activeOnly = true) { return this.db.select().from(states).where(and(eq(states.countryId, countryId), activeOnly ? eq(states.isActive, true) : undefined)) as Promise<State[]>; }
  async findById(id: string)        { const r = await this.db.select().from(states).where(eq(states.id, id)).limit(1); return (r[0] as State) ?? null; }
  async create(data: CreateStateDTO) { const r = await this.db.insert(states).values({ id: uuidv4(), ...(data as any), isActive: true, createdAt: now(), updatedAt: now() }).returning(); return r[0] as State; }
  async delete(id: string) { const r = await this.db.update(states).set({ isActive: false, updatedAt: now() }).where(eq(states.id, id)).returning({ id: states.id }); return r.length > 0; }
}

// ─── City DAL ─────────────────────────────────────────────────────────────────
export class PgCityDAL implements ICityDAL {
  constructor(private db: PgDB) {}
  async findByState(stateId: string) { return this.db.select().from(cities).where(and(eq(cities.stateId, stateId), eq(cities.isActive, true))) as Promise<City[]>; }
  async search(query: string, stateId?: string) { const where = stateId ? and(ilike(cities.name, `%${query}%`), eq(cities.stateId, stateId)) : ilike(cities.name, `%${query}%`); return this.db.select().from(cities).where(where).limit(100) as Promise<City[]>; }
  async findById(id: string)         { const r = await this.db.select().from(cities).where(eq(cities.id, id)).limit(1); return (r[0] as City) ?? null; }
  async create(data: CreateCityDTO)  { const r = await this.db.insert(cities).values({ id: uuidv4(), ...(data as any), isActive: true, createdAt: now(), updatedAt: now() }).returning(); return r[0] as City; }
  async delete(id: string) { const r = await this.db.update(cities).set({ isActive: false, updatedAt: now() }).where(eq(cities.id, id)).returning({ id: cities.id }); return r.length > 0; }
}

// ─── Category DAL ─────────────────────────────────────────────────────────────
export class PgCategoryDAL implements ICategoryDAL {
  constructor(private db: PgDB) {}
  async findAll(activeOnly = true)            { return this.db.select().from(categories).where(activeOnly ? eq(categories.isActive, true) : undefined) as Promise<Category[]>; }
  async findByParent(parentId: string | null) { const where = parentId === null ? eq(categories.isActive, true) : eq(categories.parentId, parentId); return this.db.select().from(categories).where(where) as Promise<Category[]>; }
  async findById(id: string)                  { const r = await this.db.select().from(categories).where(eq(categories.id, id)).limit(1); return (r[0] as Category) ?? null; }
  async findByCode(code: string)              { const r = await this.db.select().from(categories).where(eq(categories.code, code)).limit(1); return (r[0] as Category) ?? null; }
  async search(query: string)                 { return this.db.select().from(categories).where(ilike(categories.name, `%${query}%`)) as Promise<Category[]>; }
  async create(data: CreateCategoryDTO) {
    const r = await this.db.insert(categories).values({
      id: uuidv4(),
      name: data.name,
      code: data.code,
      parentId: nullableId(data.parentId),
      description: data.description || null,
      icon: data.icon || null,
      metadata: data.metadata ?? null,
      sortOrder: numericValue(data.sortOrder),
      isActive: true,
      createdAt: now(),
      updatedAt: now(),
    }).returning();
    return r[0] as Category;
  }
  async update(id: string, data: UpdateCategoryDTO) {
    const updateData = {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.code !== undefined && { code: data.code }),
      ...(data.parentId !== undefined && { parentId: nullableId(data.parentId) }),
      ...(data.description !== undefined && { description: data.description || null }),
      ...(data.icon !== undefined && { icon: data.icon || null }),
      ...(data.metadata !== undefined && { metadata: data.metadata ?? null }),
      ...(data.sortOrder !== undefined && { sortOrder: numericValue(data.sortOrder) }),
      updatedAt: now(),
    };
    const r = await this.db.update(categories).set(updateData).where(eq(categories.id, id)).returning();
    return (r[0] as Category) ?? null;
  }
  async delete(id: string) { const r = await this.db.update(categories).set({ isActive: false, updatedAt: now() }).where(eq(categories.id, id)).returning({ id: categories.id }); return r.length > 0; }
}

// ─── Tag DAL ──────────────────────────────────────────────────────────────────
export class PgTagDAL implements ITagDAL {
  constructor(private db: PgDB) {}
  async findAll(activeOnly = true) { return this.db.select().from(tags).where(activeOnly ? eq(tags.isActive, true) : undefined) as Promise<Tag[]>; }
  async findById(id: string)       { const r = await this.db.select().from(tags).where(eq(tags.id, id)).limit(1); return (r[0] as Tag) ?? null; }
  async findBySlug(slug: string)   { const r = await this.db.select().from(tags).where(eq(tags.slug, slug)).limit(1); return (r[0] as Tag) ?? null; }
  async create(data: CreateTagDTO) {
    const slug = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const r = await this.db.insert(tags).values({ id: uuidv4(), name: data.name, slug, color: data.color ?? null, isActive: true, createdAt: now(), updatedAt: now() }).returning();
    return r[0] as Tag;
  }
  async delete(id: string) { const r = await this.db.update(tags).set({ isActive: false, updatedAt: now() }).where(eq(tags.id, id)).returning({ id: tags.id }); return r.length > 0; }
}

// ─── Document Type DAL ────────────────────────────────────────────────────────
export class PgDocumentTypeDAL implements IDocumentTypeDAL {
  constructor(private db: PgDB) {}
  async findAll(activeOnly = true)    { return this.db.select().from(documentTypes).where(activeOnly ? eq(documentTypes.isActive, true) : undefined) as Promise<DocumentType[]>; }
  async findById(id: string)          { const r = await this.db.select().from(documentTypes).where(eq(documentTypes.id, id)).limit(1); return (r[0] as DocumentType) ?? null; }
  async findByCode(code: string)      { const r = await this.db.select().from(documentTypes).where(eq(documentTypes.code, code)).limit(1); return (r[0] as DocumentType) ?? null; }
  async create(data: CreateDocumentTypeDTO) { const r = await this.db.insert(documentTypes).values({ id: uuidv4(), ...data, allowedMimeTypes: data.allowedMimeTypes ?? [], maxSizeMb: data.maxSizeMb ?? 10, isRequired: data.isRequired ?? false, isActive: true, createdAt: now(), updatedAt: now() }).returning(); return r[0] as DocumentType; }
  async delete(id: string) { const r = await this.db.update(documentTypes).set({ isActive: false, updatedAt: now() }).where(eq(documentTypes.id, id)).returning({ id: documentTypes.id }); return r.length > 0; }
}

// ─── Settings DAL ─────────────────────────────────────────────────────────────
export class PgSettingDAL implements ISettingDAL {
  constructor(private db: PgDB) {}
  async findAll()              { return this.db.select().from(systemSettings) as Promise<SystemSetting[]>; }
  async findPublic()           { return this.db.select().from(systemSettings).where(eq(systemSettings.isPublic, true)) as Promise<SystemSetting[]>; }
  async findByKey(key: string) { const r = await this.db.select().from(systemSettings).where(eq(systemSettings.key, key)).limit(1); return (r[0] as SystemSetting) ?? null; }
  async upsert(data: UpsertSettingDTO) {
    const existing = await this.findByKey(data.key);
    if (existing) {
      const r = await this.db.update(systemSettings).set({ ...data, updatedAt: now() }).where(eq(systemSettings.key, data.key)).returning();
      return r[0] as SystemSetting;
    }
    const r = await this.db.insert(systemSettings).values({ id: uuidv4(), ...data, type: data.type ?? 'string', category: data.category ?? 'general', isPublic: data.isPublic ?? false, createdAt: now(), updatedAt: now() }).returning();
    return r[0] as SystemSetting;
  }
  async delete(key: string) { const r = await this.db.delete(systemSettings).where(eq(systemSettings.key, key)).returning({ id: systemSettings.id }); return r.length > 0; }
}

// ─── Service Type DAL ─────────────────────────────────────────────────────────
export class PgServiceTypeDAL implements IServiceTypeDAL {
  constructor(private db: PgDB) {}
  async findAll(activeOnly = true)    { return this.db.select().from(serviceTypes).where(activeOnly ? eq(serviceTypes.isActive, true) : undefined) as Promise<ServiceType[]>; }
  async findById(id: string)          { const r = await this.db.select().from(serviceTypes).where(eq(serviceTypes.id, id)).limit(1); return (r[0] as ServiceType) ?? null; }
  async findByCode(code: string)      { const r = await this.db.select().from(serviceTypes).where(eq(serviceTypes.code, code)).limit(1); return (r[0] as ServiceType) ?? null; }
  async create(data: CreateServiceTypeDTO) { const r = await this.db.insert(serviceTypes).values({ id: uuidv4(), name: data.name, code: data.code, description: data.description ?? null, routeLink: data.routeLink ?? null, icon: data.icon ?? null, isActive: true, createdAt: now(), updatedAt: now() }).returning(); return r[0] as ServiceType; }
  async update(id: string, data: UpdateServiceTypeDTO) { const r = await this.db.update(serviceTypes).set({ ...(data as any), updatedAt: now() }).where(eq(serviceTypes.id, id)).returning(); return (r[0] as ServiceType) ?? null; }
  async delete(id: string) { const r = await this.db.update(serviceTypes).set({ isActive: false, updatedAt: now() }).where(eq(serviceTypes.id, id)).returning({ id: serviceTypes.id }); return r.length > 0; }
}
