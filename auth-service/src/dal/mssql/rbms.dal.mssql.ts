import { v4 as uuidv4 } from 'uuid';
import type { ConnectionPool } from 'mssql';
import { CreateCompanyOrUtilityDTO, CreateModuleMenuDTO, ICompanyOrUtility, IModuleMenu, UpdateCompanyOrUtilityDTO, UpdateModuleMenuDTO } from '../../modules/master/master.types';
import { ICompanyOrUtilityDAL, IModuleMenuDAL } from '../interfaces/rbms.dal.interface';
import { mapCompanyRow, mapModuleRow } from '../common/rbms.mapper';

export class MssqlCompanyOrUtilityDAL implements ICompanyOrUtilityDAL {
  constructor(private readonly pool: ConnectionPool) {}

  async findAll(activeOnly = true): Promise<ICompanyOrUtility[]> {
    const result = await this.pool.request().query(`SELECT id, name, code, [type] AS type, description, is_active AS isActive, created_at AS createdAt, updated_at AS updatedAt FROM dbo.company_or_utilities ${activeOnly ? 'WHERE is_active = 1' : ''} ORDER BY name`);
    return result.recordset.map(mapCompanyRow);
  }

  async findById(id: string): Promise<ICompanyOrUtility | null> {
    const result = await this.pool.request().input('id', id).query('SELECT id, name, code, [type] AS type, description, is_active AS isActive, created_at AS createdAt, updated_at AS updatedAt FROM dbo.company_or_utilities WHERE id = @id');
    return result.recordset[0] ? mapCompanyRow(result.recordset[0]) : null;
  }

  async findByCode(code: string): Promise<ICompanyOrUtility | null> {
    const result = await this.pool.request().input('code', code).query('SELECT id, name, code, [type] AS type, description, is_active AS isActive, created_at AS createdAt, updated_at AS updatedAt FROM dbo.company_or_utilities WHERE code = @code');
    return result.recordset[0] ? mapCompanyRow(result.recordset[0]) : null;
  }

  async create(data: CreateCompanyOrUtilityDTO): Promise<ICompanyOrUtility> {
    const id = uuidv4();
    await this.pool.request()
      .input('id', id).input('name', data.name).input('code', data.code)
      .input('type', data.type ?? 'company').input('description', data.description ?? null)
      .query('INSERT INTO dbo.company_or_utilities (id, name, code, [type], description, is_active, created_at, updated_at) VALUES (@id, @name, @code, @type, @description, 1, GETUTCDATE(), GETUTCDATE())');
    return (await this.findById(id))!;
  }

  async update(id: string, data: UpdateCompanyOrUtilityDTO): Promise<ICompanyOrUtility | null> {
    const sets: string[] = ['updated_at = GETUTCDATE()'];
    const req = this.pool.request().input('id', id);
    const fieldMap: Record<string, string> = { name: 'name', code: 'code', type: '[type]', description: 'description' };
    for (const [key, col] of Object.entries(fieldMap)) {
      if (key in data) { req.input(key, (data as Record<string, unknown>)[key]); sets.push(`${col} = @${key}`); }
    }
    if (data.isActive !== undefined) { req.input('active', data.isActive ? 1 : 0); sets.push('is_active = @active'); }
    await req.query(`UPDATE dbo.company_or_utilities SET ${sets.join(', ')} WHERE id = @id`);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.pool.request().input('id', id).query('UPDATE dbo.company_or_utilities SET is_active = 0, updated_at = GETUTCDATE() WHERE id = @id');
    return (result.rowsAffected[0] ?? 0) > 0;
  }
}

export class MssqlModuleMenuDAL implements IModuleMenuDAL {
  constructor(private readonly pool: ConnectionPool) {}

  async findAll(activeOnly = true): Promise<IModuleMenu[]> {
    const result = await this.pool.request().query(`SELECT id, name, code, route, icon, parent_id AS parentId, module_type AS moduleType, sort_order AS sortOrder, permissions, is_active AS isActive, created_at AS createdAt, updated_at AS updatedAt FROM dbo.module_menus ${activeOnly ? 'WHERE is_active = 1' : ''} ORDER BY sort_order, name`);
    return result.recordset.map(mapModuleRow);
  }

  async findById(id: string): Promise<IModuleMenu | null> {
    const result = await this.pool.request().input('id', id).query('SELECT id, name, code, route, icon, parent_id AS parentId, module_type AS moduleType, sort_order AS sortOrder, permissions, is_active AS isActive, created_at AS createdAt, updated_at AS updatedAt FROM dbo.module_menus WHERE id = @id');
    return result.recordset[0] ? mapModuleRow(result.recordset[0]) : null;
  }

  async findByCode(code: string): Promise<IModuleMenu | null> {
    const result = await this.pool.request().input('code', code).query('SELECT id, name, code, route, icon, parent_id AS parentId, module_type AS moduleType, sort_order AS sortOrder, permissions, is_active AS isActive, created_at AS createdAt, updated_at AS updatedAt FROM dbo.module_menus WHERE code = @code');
    return result.recordset[0] ? mapModuleRow(result.recordset[0]) : null;
  }

  async create(data: CreateModuleMenuDTO): Promise<IModuleMenu> {
    const id = uuidv4();
    await this.pool.request()
      .input('id', id).input('name', data.name).input('code', data.code).input('route', data.route)
      .input('icon', data.icon ?? null).input('parentId', data.parentId || null)
      .input('moduleType', data.moduleType ?? 'admin')
      .input('sortOrder', data.sortOrder ?? 0).input('permissions', JSON.stringify(data.permissions ?? []))
      .query('INSERT INTO dbo.module_menus (id, name, code, route, icon, parent_id, module_type, sort_order, permissions, is_active, created_at, updated_at) VALUES (@id, @name, @code, @route, @icon, @parentId, @moduleType, @sortOrder, @permissions, 1, GETUTCDATE(), GETUTCDATE())');
    return (await this.findById(id))!;
  }

  async update(id: string, data: UpdateModuleMenuDTO): Promise<IModuleMenu | null> {
    const sets: string[] = ['updated_at = GETUTCDATE()'];
    const req = this.pool.request().input('id', id);
    const fieldMap: Record<string, string> = { name: 'name', code: 'code', route: 'route', icon: 'icon', parentId: 'parent_id', moduleType: 'module_type', sortOrder: 'sort_order' };
    for (const [key, col] of Object.entries(fieldMap)) {
      if (key in data) { req.input(key, (data as Record<string, unknown>)[key]); sets.push(`${col} = @${key}`); }
    }
    if (data.permissions !== undefined) { req.input('permissions', JSON.stringify(data.permissions)); sets.push('permissions = @permissions'); }
    if (data.isActive !== undefined) { req.input('active', data.isActive ? 1 : 0); sets.push('is_active = @active'); }
    await req.query(`UPDATE dbo.module_menus SET ${sets.join(', ')} WHERE id = @id`);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.pool.request().input('id', id).query('UPDATE dbo.module_menus SET is_active = 0, updated_at = GETUTCDATE() WHERE id = @id');
    return (result.rowsAffected[0] ?? 0) > 0;
  }
}
