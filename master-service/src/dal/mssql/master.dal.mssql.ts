import { ConnectionPool } from 'mssql';
import type {
  ICountryDAL,
  IStateDAL,
  ICityDAL,
  ICategoryDAL,
  ITagDAL,
  IDocumentTypeDAL,
  ISettingDAL
} from '../interfaces/master.dal.interfaces';
import type { DocumentType, SystemSetting, UpsertSettingDTO } from '../../modules/coredata/coredata.types';

const now = () => new Date();

export class MssqlCountryDAL implements ICountryDAL {
  constructor(private pool: ConnectionPool) {}

  async findAll(activeOnly = true) {
    const q = activeOnly
      ? `SELECT * FROM countries WHERE is_active = 1`
      : `SELECT * FROM countries`;

    const r = await this.pool.request().query(q);
    return r.recordset;
  }

  async findById(id: string) {
    const r = await this.pool.request()
      .input('id', id)
      .query(`SELECT * FROM countries WHERE id = @id`);
    return r.recordset[0] ?? null;
  }

  async findByCode(code: string) {
    const r = await this.pool.request()
      .input('code', code)
      .query(`SELECT * FROM countries WHERE code = @code`);
    return r.recordset[0] ?? null;
  }

  async create(data: any) {
    const r = await this.pool.request()
      .input('name', data.name)
      .input('code', data.code)
      .query(`
        INSERT INTO countries (id, name, code, is_active, created_at, updated_at)
        OUTPUT INSERTED.*
        VALUES (NEWID(), @name, @code, 1, GETDATE(), GETDATE())
      `);
    return r.recordset[0];
  }

  async update(id: string, data: any) {
    const r = await this.pool.request()
      .input('id', id)
      .input('name', data.name)
      .query(`
        UPDATE countries
        SET name = @name, updated_at = GETDATE()
        OUTPUT INSERTED.*
        WHERE id = @id
      `);
    return r.recordset[0] ?? null;
  }

  async delete(id: string) {
    const r = await this.pool.request()
      .input('id', id)
      .query(`
        UPDATE countries
        SET is_active = 0
        WHERE id = @id
      `);
    return r.rowsAffected[0] > 0;
  }
}

export class MssqlStateDAL implements IStateDAL {
  constructor(private pool: ConnectionPool) {
    }   
    async findAll(activeOnly = true) {
        const q = activeOnly
            ? `SELECT * FROM states WHERE is_active = 1`
            : `SELECT * FROM states`;
        const r = await this.pool.request().query(q);
        return r.recordset;
    }   
    async findByCountry(countryId: string, activeOnly = true) {
        const q = activeOnly
            ? `SELECT * FROM states WHERE country_id = @countryId AND is_active = 1`
            : `SELECT * FROM states WHERE country_id = @countryId`; 
        const r = await this.pool.request()
            .input('countryId', countryId)
            .query(q);
        return r.recordset;
    }   
    async findById(id: string) {
        const r = await this.pool.request()
            .input('id', id)
            .query(`SELECT * FROM states WHERE id = @id`);
        return r.recordset[0] ?? null;
    }
    async create(data: any) {
        const r = await this.pool.request()
            .input('name', data.name)
            .input('countryId', data.countryId)
            .query(`
                INSERT INTO states (id, name, country_id, is_active
                , created_at, updated_at)
                OUTPUT INSERTED.*
                VALUES (NEWID(), @name, @countryId, 1, GETDATE(), GETDATE())
            `);
        return r.recordset[0];
    }   
    async delete(id: string) {
        const r = await this.pool.request()
            .input('id', id)
            .query(`
                UPDATE states
                SET is_active = 0, updated_at = GETDATE()
                WHERE id = @id
            `);
        return r.rowsAffected[0] > 0;
    }   
}

export class MssqlCityDAL implements ICityDAL {
    constructor(private pool: ConnectionPool) {}
    async findByState(stateId: string) {
        const r = await this.pool.request()
            .input('stateId', stateId)
            .query(`SELECT * FROM cities WHERE state_id = @stateId AND is_active = 1`);
        return r.recordset;
    }
    async search(query: string, stateId?: string) {
        const r = await this.pool.request()
            .input('query', `%${query}%`)
            .input('stateId', stateId)
            .query(`
                SELECT * FROM cities
                WHERE name LIKE @query
                ${stateId ? 'AND state_id = @stateId' : ''}
                AND is_active = 1
                ORDER BY name
                OFFSET 0 ROWS FETCH NEXT 100 ROWS ONLY
            `);
        return r.recordset;
    }
    async findById(id: string) {
        const r = await this.pool.request()
            .input('id', id)
            .query(`SELECT * FROM cities WHERE id = @id`);
        return r.recordset[0] ?? null;
    }
    async create(data: any) {
        const r = await this.pool.request()
            .input('name', data.name)
            .input('stateId', data.stateId)
            .query(`
                INSERT INTO cities (id, name, state_id, is_active, created_at, updated_at)
                OUTPUT INSERTED.*
                VALUES (NEWID(), @name, @stateId, 1, GETDATE(), GETDATE())
            `);
        return r.recordset[0];
    }   
    async delete(id: string) {
        const r = await this.pool.request()
            .input('id', id)
            .query(`
                UPDATE cities
                SET is_active = 0, updated_at = GETDATE()
                WHERE id = @id
            `);
        return r.rowsAffected[0] > 0;
    }
}

export class MssqlCategoryDAL implements ICategoryDAL {
  constructor(private pool: ConnectionPool) {}
    async findAll(activeOnly = true) {
        const q = activeOnly
            ? `SELECT * FROM categories WHERE is_active = 1`
            : `SELECT * FROM categories`;
        const r = await this.pool.request().query(q);
        return r.recordset;
    }
    async findByParent(parentId: string | null) {
        const r = await this.pool.request()
            .input('parentId', parentId)
            .query(`
                SELECT * FROM categories
                WHERE ${parentId === null ? 'parent_id IS NULL' : 'parent_id = @parentId'}
                AND is_active = 1
            `);
        return r.recordset;
    }
    async findById(id: string) {
        const r = await this.pool.request()
            .input('id', id)
            .query(`SELECT * FROM categories WHERE id = @id`);
        return r.recordset[0] ?? null;
    }   
    async findByCode(code: string) {
        const r = await this.pool.request()
            .input('code', code)
            .query(`SELECT * FROM categories WHERE code = @code`);
        return r.recordset[0] ?? null;
    }
    async search(query: string) {
        const r = await this.pool.request()
            .input('query', `%${query}%`)
            .query(`
                SELECT * FROM categories
                WHERE name LIKE @query
                AND is_active = 1
                ORDER BY name
            `);
        return r.recordset;
    }
    async create(data: any) {
        const r = await this.pool.request()
            .input('name', data.name)
            .input('code', data.code)
            .input('parentId', data.parentId)
            .input('sortOrder', data.sortOrder ?? 0)    
            .query(`
                INSERT INTO categories (id, name, code, parent_id, sort_order, is_active, created_at, updated_at)
                OUTPUT INSERTED.*
                VALUES (NEWID(), @name, @code, @parentId, @sortOrder, 1, GETDATE(), GETDATE())
            `);
        return r.recordset[0];
    }   
    async update(id: string, data: any) {
        const r = await this.pool.request()
            .input('id', id)    
            .input('name', data.name)
            .input('code', data.code)
            .input('parentId', data.parentId)
            .input('sortOrder', data.sortOrder ?? 0)
            .query(`
                UPDATE categories
                SET name = @name, code = @code, parent_id = @parentId, sort_order = @sortOrder, updated_at = GETDATE()
                OUTPUT INSERTED.*
                WHERE id = @id
            `);
        return r.recordset[0] ?? null;
    }       
    async delete(id: string) {
        const r = await this.pool.request()
            .input('id', id)
            .query(`
                UPDATE categories
                SET is_active = 0, updated_at = GETDATE()
                WHERE id = @id
            `);
        return r.rowsAffected[0] > 0;
    }   
}

export class MssqlTagDAL implements ITagDAL {
    constructor(private pool: ConnectionPool) {}
    async findAll(activeOnly = true) {
        const q = activeOnly            ? `SELECT * FROM tags WHERE is_active = 1`
            : `SELECT * FROM tags`;
        const r = await this.pool.request().query(q);
        return r.recordset;
    }
    async findById(id: string) {
        const r = await this.pool.request()
            .input('id', id)
            .query(`SELECT * FROM tags WHERE id = @id`);
        return r.recordset[0] ?? null;
    }
    async findBySlug(slug: string) {
        const r = await this.pool.request()
            .input('slug', slug)
            .query(`SELECT * FROM tags WHERE slug = @slug`);
        return r.recordset[0] ?? null;
    }
    async create(data: any) {
        const slug = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const r = await this.pool.request()
            .input('name', data.name)
            .input('slug', slug)
            .input('color', data.color ?? null)
            .query(`
                INSERT INTO tags (id, name, slug, color, is_active, created_at, updated_at)
                OUTPUT INSERTED.*
                VALUES (NEWID(), @name, @slug, @color, 1, GETDATE(), GETDATE()) 
            `);
        return r.recordset[0];
    }
    async delete(id: string) {
        const r = await this.pool.request()
            .input('id', id)
            .query(`
                UPDATE tags
                SET is_active = 0, updated_at = GETDATE()
                WHERE id = @id
            `);
        return r.rowsAffected[0] > 0;
    }
}

export class MssqlDocumentTypeDAL implements IDocumentTypeDAL {
    constructor(private pool: ConnectionPool) {}
    findByCode(code: string): Promise<DocumentType | null> {
        throw new Error('Method not implemented.');
    }
    async findAll(activeOnly = true) {
        const q = activeOnly
            ? `SELECT * FROM document_types WHERE is_active = 1`
            : `SELECT * FROM document_types`;
        const r = await this.pool.request().query(q);
        return r.recordset;
    }
    async findById(id: string) {
        const r = await this.pool.request()
            .input('id', id)
            .query(`SELECT * FROM document_types WHERE id = @id`);
        return r.recordset[0] ?? null;
    }
    async create(data: any) {
        const r = await this.pool.request()
            .input('name', data.name)
            .input('code', data.code)
            .input('description', data.description ?? null)
            .input('allowedMimeTypes', JSON.stringify(data.allowedMimeTypes))
            .input('maxSizeMb', data.maxSizeMb)
            .input('isRequired', data.isRequired)
            .query(`
                INSERT INTO document_types (id, name, code, description, allowed_mime_types, max_size_mb, is_required, is_active, created_at, updated_at)
                OUTPUT INSERTED.*
                VALUES (NEWID(), @name, @code, @description, @allowedMimeTypes, @maxSizeMb, @isRequired, 1, GETDATE(), GETDATE())
            `);
        return r.recordset[0];
    }
    async delete(id: string) {
        const r = await this.pool.request()
            .input('id', id)
            .query(`
                UPDATE document_types
                SET is_active = 0, updated_at = GETDATE()
                WHERE id = @id
            `);
        return r.rowsAffected[0] > 0;
    }
}

export class MssqlSettingDAL implements ISettingDAL {
    constructor(private pool: ConnectionPool) {}

    // Backward-compatible alias
    async list() {
        return this.findAll();
    }

    async findAll(): Promise<SystemSetting[]> {
        const r = await this.pool.request().query(`SELECT * FROM settings WHERE is_active = 1`);
        return r.recordset;
    }

    async findPublic(): Promise<SystemSetting[]> {
        const r = await this.pool.request().query(`
            SELECT * FROM settings
            WHERE is_active = 1 AND is_public = 1
        `);
        return r.recordset;
    }

    async findByKey(key: string): Promise<SystemSetting | null> {
        const r = await this.pool.request()
            .input('key', key)
            .query(`SELECT * FROM settings WHERE [key] = @key AND is_active = 1`);
        return r.recordset[0] ?? null;
    }

    async upsert(data: UpsertSettingDTO): Promise<SystemSetting> {
        const existing = await this.findByKey(data.key);

        if (existing) {
            const r = await this.pool.request()
                .input('key', data.key)
                .input('value', data.value ?? null)
                .input('type', data.type ?? 'string')
                .input('description', data.description ?? null)
                .input('isPublic', data.isPublic ?? false)
                .input('category', data.category ?? 'general')
                .query(`
                    UPDATE settings
                    SET value = @value,
                        type = @type,
                        description = @description,
                        is_public = @isPublic,
                        category = @category,
                        is_active = 1,
                        updated_at = GETDATE()
                    OUTPUT INSERTED.*
                    WHERE [key] = @key
                `);
            return r.recordset[0];
        }

        const r = await this.pool.request()
            .input('key', data.key)
            .input('value', data.value ?? null)
            .input('type', data.type ?? 'string')
            .input('description', data.description ?? null)
            .input('isPublic', data.isPublic ?? false)
            .input('category', data.category ?? 'general')
            .query(`
                INSERT INTO settings (
                    id, [key], value, type, description,
                    is_public, category, is_active, created_at, updated_at
                )
                OUTPUT INSERTED.*
                VALUES (
                    NEWID(), @key, @value, @type, @description,
                    @isPublic, @category, 1, GETDATE(), GETDATE()
                )
            `);

        return r.recordset[0];
    }

    async delete(key: string) {
        const r = await this.pool.request()
            .input('key', key)
            .query(`
                UPDATE settings
                SET is_active = 0, updated_at = GETDATE()
                WHERE [key] = @key
            `);
        return r.rowsAffected[0] > 0;
    }
}