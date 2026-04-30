import { MasterDALFactory, MasterDALBundle } from '../../dal/dal.factory';
import { CacheService, DatabaseType } from '@prasad-rtns/shared';
import type { CreateCountryDTO, UpdateCountryDTO, CreateStateDTO, CreateCityDTO, CreateCategoryDTO, UpdateCategoryDTO, CreateTagDTO, CreateDocumentTypeDTO, UpsertSettingDTO, CreateServiceTypeDTO, UpdateServiceTypeDTO } from './coredata.types';
import logger from '../../database/logger';

const cache = new CacheService('master');

// ─── Base factory helper ──────────────────────────────────────────────────────
async function getDal(dbType: DatabaseType): Promise<MasterDALBundle> {
  return MasterDALFactory.get(dbType);
}

// ─────────────────────────────────────────────────────────────────────────────
//  CountryService
// ─────────────────────────────────────────────────────────────────────────────
export class CountryService {
  private constructor(private readonly dal: MasterDALBundle) {}
  static async create(dbType: DatabaseType) { 
    return new CountryService(await getDal(dbType)); 
  }

  async listAll() {
    const cached = await cache.get<unknown[]>('countries:all');
    if (cached) return cached;
    const data = await this.dal.country.findAll(true);
    await cache.set('countries:all', data, 3600);
    return data;
  }

  async getById(id: string) {
    const c = await this.dal.country.findById(id);
    if (!c) throw new Error('Country not found');
    return c;
  }

  async create(data: CreateCountryDTO) {
    const existing = await this.dal.country.findByCode(data.code);
    if (existing) throw new Error(`Country code '${data.code}' already exists`);
    const result = await this.dal.country.create(data);
    await cache.del('countries:all');
    logger.info('Country created', { id: result.id });
    return result;
  }

  async update(id: string, data: UpdateCountryDTO) {
    const result = await this.dal.country.update(id, data);
    if (!result) throw new Error('Country not found');
    await cache.del('countries:all');
    return result;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  StateService
// ─────────────────────────────────────────────────────────────────────────────
export class StateService {
  private constructor(private readonly dal: MasterDALBundle) {}
  static async create(dbType: DatabaseType) { return new StateService(await getDal(dbType)); }

  async listByCountry(countryId: string) {
    const key    = `states:${countryId}`;
    const cached = await cache.get<unknown[]>(key);
    if (cached) return cached;
    const data = await this.dal.state.findByCountry(countryId);
    await cache.set(key, data, 3600);
    return data;
  }

  async listAll() {
    const cached = await cache.get<unknown[]>('states:all');
    if (cached) return cached;
    const data = await this.dal.state.findAll(true);
    await cache.set('states:all', data, 3600);
    return data;
  }

  async getById(id: string) {
    const s = await this.dal.state.findById(id);
    if (!s) throw new Error('State not found');
    return s;
  }

  async create(data: CreateStateDTO) {
    const result = await this.dal.state.create(data);
    await cache.del('states:all');
    await cache.del(`states:${data.countryId}`);
    return result;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  CityService
// ─────────────────────────────────────────────────────────────────────────────
export class CityService {
  private constructor(private readonly dal: MasterDALBundle) {}
  static async create(dbType: DatabaseType) { return new CityService(await getDal(dbType)); }

  async listByState(stateId: string) {
    return this.dal.city.findByState(stateId);
  }

  async search(query: string, stateId?: string) {
    return this.dal.city.search(query, stateId);
  }

  async getById(id: string) {
    const c = await this.dal.city.findById(id);
    if (!c) throw new Error('City not found');
    return c;
  }

  async create(data: CreateCityDTO) {
    return this.dal.city.create(data);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  CategoryService
// ─────────────────────────────────────────────────────────────────────────────
export class CategoryService {
  private constructor(private readonly dal: MasterDALBundle) {}
  static async create(dbType: DatabaseType) { return new CategoryService(await getDal(dbType)); }

  async listAll(search?: string) {
    if (search) return this.dal.category.search(search);
    const cached = await cache.get<unknown[]>('categories:all');
    if (cached) return cached;
    const data = await this.dal.category.findAll(true);
    await cache.set('categories:all', data, 1800);
    return data;
  }

  async listByParent(parentId: string | null) {
    return this.dal.category.findByParent(parentId);
  }

  async getById(id: string) {
    const c = await this.dal.category.findById(id);
    if (!c) throw new Error('Category not found');
    return c;
  }

  async create(data: CreateCategoryDTO) {
    const existing = await this.dal.category.findByCode(data.code);
    if (existing) throw new Error(`Category code '${data.code}' already exists`);
    const result = await this.dal.category.create(data);
    await cache.del('categories:all');
    return result;
  }

  async update(id: string, data: UpdateCategoryDTO) {
    const result = await this.dal.category.update(id, data);
    if (!result) throw new Error('Category not found');
    await cache.del('categories:all');
    return result;
  }

  async delete(id: string) {
    const ok = await this.dal.category.delete(id);
    if (!ok) throw new Error('Category not found');
    await cache.del('categories:all');
    return { message: 'Category deactivated' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  TagService
// ─────────────────────────────────────────────────────────────────────────────
export class TagService {
  private constructor(private readonly dal: MasterDALBundle) {}
  static async create(dbType: DatabaseType) { return new TagService(await getDal(dbType)); }

  async listAll() {
    const cached = await cache.get<unknown[]>('tags:all');
    if (cached) return cached;
    const data = await this.dal.tag.findAll(true);
    await cache.set('tags:all', data, 1800);
    return data;
  }

  async create(data: CreateTagDTO) {
    const slug = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const existing = await this.dal.tag.findBySlug(slug);
    if (existing) throw new Error(`Tag '${data.name}' already exists`);
    const result = await this.dal.tag.create(data);
    await cache.del('tags:all');
    return result;
  }

  async delete(id: string) {
    const ok = await this.dal.tag.delete(id);
    if (!ok) throw new Error('Tag not found');
    await cache.del('tags:all');
    return { message: 'Tag deleted' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  DocumentTypeService
// ─────────────────────────────────────────────────────────────────────────────
export class DocumentTypeService {
  private constructor(private readonly dal: MasterDALBundle) {}
  static async create(dbType: DatabaseType) { return new DocumentTypeService(await getDal(dbType)); }

  async listAll() {
    const cached = await cache.get<unknown[]>('doc_types:all');
    if (cached) return cached;
    const data = await this.dal.documentType.findAll(true);
    await cache.set('doc_types:all', data, 3600);
    return data;
  }

  async getById(id: string) {
    const d = await this.dal.documentType.findById(id);
    if (!d) throw new Error('Document type not found');
    return d;
  }

  async create(data: CreateDocumentTypeDTO) {
    const existing = await this.dal.documentType.findByCode(data.code);
    if (existing) throw new Error(`Document type code '${data.code}' already exists`);
    const result = await this.dal.documentType.create(data);
    await cache.del('doc_types:all');
    return result;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  SettingsService
// ─────────────────────────────────────────────────────────────────────────────
export class SettingsService {
  private constructor(private readonly dal: MasterDALBundle) {}
  static async create(dbType: DatabaseType) { return new SettingsService(await getDal(dbType)); }

  async getPublicSettings() {
    const cached = await cache.get<unknown[]>('settings:public');
    if (cached) return cached;
    const data = await this.dal.setting.findPublic();
    await cache.set('settings:public', data, 300);
    return data;
  }

  async getAllSettings() {
    return this.dal.setting.findAll();
  }

  async getByKey(key: string) {
    const s = await this.dal.setting.findByKey(key);
    if (!s) throw new Error(`Setting '${key}' not found`);
    return s;
  }

  async upsert(data: UpsertSettingDTO) {
    const result = await this.dal.setting.upsert(data);
    await cache.del('settings:public');
    return result;
  }

  async delete(key: string) {
    const ok = await this.dal.setting.delete(key);
    if (!ok) throw new Error(`Setting '${key}' not found`);
    await cache.del('settings:public');
    return { message: 'Setting deleted' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  ServiceTypeService
// ─────────────────────────────────────────────────────────────────────────────
export class ServiceTypeService {
  private constructor(private readonly dal: MasterDALBundle) {}
  static async create(dbType: DatabaseType) { return new ServiceTypeService(await getDal(dbType)); }

  async listAll() {
    const cached = await cache.get<unknown[]>('service_types:all');
    if (cached) return cached;
    const data = await this.dal.serviceType.findAll(true);
    await cache.set('service_types:all', data, 3600);
    return data;
  }

  async getById(id: string) {
    const s = await this.dal.serviceType.findById(id);
    if (!s) throw new Error('Service type not found');
    return s;
  }

  async create(data: CreateServiceTypeDTO) {
    const existing = await this.dal.serviceType.findByCode(data.code);
    if (existing) throw new Error(`Service type code '${data.code}' already exists`);
    const result = await this.dal.serviceType.create(data);
    await cache.del('service_types:all');
    logger.info('ServiceType created', { id: result.id });
    return result;
  }

  async update(id: string, data: UpdateServiceTypeDTO) {
    const result = await this.dal.serviceType.update(id, data);
    if (!result) throw new Error('Service type not found');
    await cache.del('service_types:all');
    return result;
  }

  async delete(id: string) {
    const ok = await this.dal.serviceType.delete(id);
    if (!ok) throw new Error('Service type not found');
    await cache.del('service_types:all');
    return { message: 'Service type deactivated' };
  }
}
