import oracledb, { Pool } from 'oracledb';
import { randomUUID } from 'crypto';

import type {
  ICountryDAL,
  IStateDAL,
  ICityDAL,
  ICategoryDAL,
  ITagDAL,
  IDocumentTypeDAL,
  ISettingDAL
} from '../interfaces/master.dal.interfaces';

import type {
  Country,
  State,
  City,
  Category,
  Tag,
  DocumentType,
  SystemSetting,
  CreateCountryDTO,
  UpdateCountryDTO,
  CreateStateDTO,
  CreateCityDTO,
  CreateCategoryDTO,
  UpdateCategoryDTO,
  CreateTagDTO,
  CreateDocumentTypeDTO,
  UpsertSettingDTO
} from '../../modules/coredata/coredata.types';

const now = () => new Date();

/* ───────────────── Helper ───────────────── */

async function execute<T>(
  pool: Pool,
  sql: string,
  binds: any = {}
): Promise<T[]> {
  const conn = await pool.getConnection();
  try {
    const result = await conn.execute(sql, binds, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      autoCommit: true,
    });
    return (result.rows ?? []) as T[];
  } finally {
    await conn.close();
  }
}

/* ───────────────── COUNTRY ───────────────── */

export class OracleCountryDAL implements ICountryDAL {

  constructor(private pool: Pool) {}

  async findAll(activeOnly = true): Promise<Country[]> {
    const sql = activeOnly
      ? `SELECT * FROM countries WHERE is_active = 1`
      : `SELECT * FROM countries`;
    return execute<Country>(this.pool, sql);
  }

  async findById(id: string): Promise<Country | null> {
    const rows = await execute<Country>(
      this.pool,
      `SELECT * FROM countries WHERE id = :id`,
      { id }
    );
    return rows[0] ?? null;
  }

  async findByCode(code: string): Promise<Country | null> {
    const rows = await execute<Country>(
      this.pool,
      `SELECT * FROM countries WHERE code = :code`,
      { code }
    );
    return rows[0] ?? null;
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

    await execute(
      this.pool,
      `INSERT INTO countries
       (id, name, code, dial_code, flag, currency, currency_symbol, is_active, created_at, updated_at)
       VALUES (:id, :name, :code, :dialCode, :flag, :currency, :currencySymbol, 1, :createdAt, :updatedAt)`,
      doc
    );

    return doc;
  }

  async update(id: string, data: UpdateCountryDTO): Promise<Country | null> {

    await execute(
      this.pool,
      `UPDATE countries SET
        name = NVL(:name, name),
        code = NVL(:code, code),
        dial_code = :dialCode,
        flag = :flag,
        currency = :currency,
        currency_symbol = :currencySymbol,
        updated_at = :updatedAt
       WHERE id = :id`,
      {
        id,
        ...data,
        updatedAt: now(),
      }
    );

    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    await execute(
      this.pool,
      `UPDATE countries SET is_active = 0 WHERE id = :id`,
      { id }
    );
    return true;
  }
}

/* ───────────────── STATE ───────────────── */

export class OracleStateDAL implements IStateDAL {

  constructor(private pool: Pool) {}

  async findAll(activeOnly = true): Promise<State[]> {
    const sql = activeOnly
      ? `SELECT * FROM states WHERE is_active = 1`
      : `SELECT * FROM states`;
    return execute<State>(this.pool, sql);
  }

  async findByCountry(countryId: string, activeOnly = true): Promise<State[]> {
    const sql = activeOnly
      ? `SELECT * FROM states WHERE country_id = :countryId AND is_active = 1`
      : `SELECT * FROM states WHERE country_id = :countryId`;
    return execute<State>(this.pool, sql, { countryId });
  }

  async findById(id: string): Promise<State | null> {
    const rows = await execute<State>(
      this.pool,
      `SELECT * FROM states WHERE id = :id`,
      { id }
    );
    return rows[0] ?? null;
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

    await execute(
      this.pool,
      `INSERT INTO states
       (id, name, code, country_id, is_active, created_at, updated_at)
       VALUES (:id, :name, :code, :countryId, 1, :createdAt, :updatedAt)`,
      doc
    );

    return doc;
  }

  async delete(id: string): Promise<boolean> {
    await execute(
      this.pool,
      `UPDATE states SET is_active = 0 WHERE id = :id`,
      { id }
    );
    return true;
  }
}

/* ───────────────── CITY ───────────────── */

export class OracleCityDAL implements ICityDAL {

  constructor(private pool: Pool) {}

  async findByState(stateId: string): Promise<City[]> {
    return execute<City>(
      this.pool,
      `SELECT * FROM cities WHERE state_id = :stateId AND is_active = 1`,
      { stateId }
    );
  }

  async search(query: string, stateId?: string): Promise<City[]> {

    let sql = `SELECT * FROM cities WHERE LOWER(name) LIKE LOWER(:query)`;
    const binds: any = { query: `%${query}%` };

    if (stateId) {
      sql += ` AND state_id = :stateId`;
      binds.stateId = stateId;
    }

    return execute<City>(this.pool, sql, binds);
  }

  async findById(id: string): Promise<City | null> {
    const rows = await execute<City>(
      this.pool,
      `SELECT * FROM cities WHERE id = :id`,
      { id }
    );
    return rows[0] ?? null;
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

    await execute(
      this.pool,
      `INSERT INTO cities
       (id, name, state_id, latitude, longitude, is_active, created_at, updated_at)
       VALUES (:id, :name, :stateId, :latitude, :longitude, 1, :createdAt, :updatedAt)`,
      doc
    );

    return doc;
  }

  async delete(id: string): Promise<boolean> {
    await execute(
      this.pool,
      `UPDATE cities SET is_active = 0 WHERE id = :id`,
      { id }
    );
    return true;
  }
}

/* ───────────────── CATEGORY ───────────────── */

export class OracleCategoryDAL implements ICategoryDAL {

  constructor(private pool: Pool) {}

  async findAll(activeOnly = true): Promise<Category[]> {
    const sql = activeOnly
      ? `SELECT * FROM categories WHERE is_active = 1`
      : `SELECT * FROM categories`;
    return execute<Category>(this.pool, sql);
  }

  async findByParent(parentId: string | null): Promise<Category[]> {

    const sql = parentId === null
      ? `SELECT * FROM categories WHERE parent_id IS NULL`
      : `SELECT * FROM categories WHERE parent_id = :parentId`;

    return execute<Category>(this.pool, sql, { parentId });
  }

  async findById(id: string): Promise<Category | null> {
    const rows = await execute<Category>(
      this.pool,
      `SELECT * FROM categories WHERE id = :id`,
      { id }
    );
    return rows[0] ?? null;
  }

  async findByCode(code: string): Promise<Category | null> {
    const rows = await execute<Category>(
      this.pool,
      `SELECT * FROM categories WHERE code = :code`,
      { code }
    );
    return rows[0] ?? null;
  }

  async search(query: string): Promise<Category[]> {
    return execute<Category>(
      this.pool,
      `SELECT * FROM categories WHERE LOWER(name) LIKE LOWER(:query)`,
      { query: `%${query}%` }
    );
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

    await execute(
      this.pool,
      `INSERT INTO categories
       (id, name, code, parent_id, description, icon, metadata, sort_order, is_active, created_at, updated_at)
       VALUES (:id, :name, :code, :parentId, :description, :icon, :metadata, :sortOrder, 1, :createdAt, :updatedAt)`,
      doc
    );

    return doc;
  }

  async update(id: string, data: UpdateCategoryDTO): Promise<Category | null> {

    await execute(
      this.pool,
      `UPDATE categories SET
        name = NVL(:name, name),
        code = NVL(:code, code),
        parent_id = :parentId,
        description = :description,
        icon = :icon,
        metadata = :metadata,
        sort_order = NVL(:sortOrder, sort_order),
        updated_at = :updatedAt
       WHERE id = :id`,
      { id, ...data, updatedAt: now() }
    );

    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    await execute(
      this.pool,
      `UPDATE categories SET is_active = 0 WHERE id = :id`,
      { id }
    );
    return true;
  }
}

/* ───────────────── TAG ───────────────── */

export class OracleTagDAL implements ITagDAL {

  constructor(private pool: Pool) {}

  async findAll(activeOnly = true): Promise<Tag[]> {
    const sql = activeOnly
      ? `SELECT * FROM tags WHERE is_active = 1`
      : `SELECT * FROM tags`;
    return execute<Tag>(this.pool, sql);
  }

  async findById(id: string): Promise<Tag | null> {
    const rows = await execute<Tag>(
      this.pool,
      `SELECT * FROM tags WHERE id = :id`,
      { id }
    );
    return rows[0] ?? null;
  }

  async findBySlug(slug: string): Promise<Tag | null> {
    const rows = await execute<Tag>(
      this.pool,
      `SELECT * FROM tags WHERE slug = :slug`,
      { slug }
    );
    return rows[0] ?? null;
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

    await execute(
      this.pool,
      `INSERT INTO tags
       (id, name, slug, color, is_active, created_at, updated_at)
       VALUES (:id, :name, :slug, :color, 1, :createdAt, :updatedAt)`,
      doc
    );

    return doc;
  }

  async delete(id: string): Promise<boolean> {
    await execute(
      this.pool,
      `UPDATE tags SET is_active = 0 WHERE id = :id`,
      { id }
    );
    return true;
  }
}

/* ───────────────── DOCUMENT TYPE ───────────────── */

export class OracleDocumentTypeDAL implements IDocumentTypeDAL {

  constructor(private pool: Pool) {}

  async findAll(activeOnly = true): Promise<DocumentType[]> {
    const sql = activeOnly
      ? `SELECT * FROM document_types WHERE is_active = 1`
      : `SELECT * FROM document_types`;
    return execute<DocumentType>(this.pool, sql);
  }

  async findById(id: string): Promise<DocumentType | null> {
    const rows = await execute<DocumentType>(
      this.pool,
      `SELECT * FROM document_types WHERE id = :id`,
      { id }
    );
    return rows[0] ?? null;
  }

  async findByCode(code: string): Promise<DocumentType | null> {
    const rows = await execute<DocumentType>(
      this.pool,
      `SELECT * FROM document_types WHERE code = :code`,
      { code }
    );
    return rows[0] ?? null;
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

    await execute(
      this.pool,
      `INSERT INTO document_types
       (id, name, code, description, allowed_mime_types, max_size_mb, is_required, is_active, created_at, updated_at)
       VALUES (:id, :name, :code, :description, :allowedMimeTypes, :maxSizeMb, :isRequired, 1, :createdAt, :updatedAt)`,
      doc
    );

    return doc;
  }

  async delete(id: string): Promise<boolean> {
    await execute(
      this.pool,
      `UPDATE document_types SET is_active = 0 WHERE id = :id`,
      { id }
    );
    return true;
  }
}

/* ───────────────── SETTINGS ───────────────── */

export class OracleSettingDAL implements ISettingDAL {

  constructor(private pool: Pool) {}

  async findAll(): Promise<SystemSetting[]> {
    return execute<SystemSetting>(
      this.pool,
      `SELECT * FROM system_settings`
    );
  }

  async findPublic(): Promise<SystemSetting[]> {
    return execute<SystemSetting>(
      this.pool,
      `SELECT * FROM system_settings WHERE is_public = 1`
    );
  }

  async findByKey(key: string): Promise<SystemSetting | null> {
    const rows = await execute<SystemSetting>(
      this.pool,
      `SELECT * FROM system_settings WHERE key = :key`,
      { key }
    );
    return rows[0] ?? null;
  }

  async upsert(data: UpsertSettingDTO): Promise<SystemSetting> {

    const id = randomUUID();

    await execute(
      this.pool,
      `MERGE INTO system_settings s
       USING (SELECT :key AS key FROM dual) d
       ON (s.key = d.key)
       WHEN MATCHED THEN
         UPDATE SET
           value = :value,
           description = :description,
           type = :type,
           category = :category,
           is_public = :isPublic,
           updated_at = :updatedAt
       WHEN NOT MATCHED THEN
         INSERT (id, key, value, description, type, category, is_public, created_at, updated_at)
         VALUES (:id, :key, :value, :description, :type, :category, :isPublic, :createdAt, :updatedAt)`,
      {
        id,
        key: data.key,
        value: data.value ?? null,
        description: data.description ?? null,
        type: data.type ?? 'string',
        category: data.category ?? 'general',
        isPublic: data.isPublic ?? false,
        createdAt: now(),
        updatedAt: now(),
      }
    );

    return (await this.findByKey(data.key))!;
  }

  async delete(key: string): Promise<boolean> {
    await execute(
      this.pool,
      `DELETE FROM system_settings WHERE key = :key`,
      { key }
    );
    return true;
  }
}