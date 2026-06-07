import { v4 as uuidv4 } from 'uuid';
import type { Pool as OraPool } from 'oracledb';
import { CreateCompanyOrUtilityDTO, CreateModuleMenuDTO, ICompanyOrUtility, IModuleMenu, UpdateCompanyOrUtilityDTO, UpdateModuleMenuDTO } from '../../modules/master/master.types';
import { ICompanyOrUtilityDAL, IModuleMenuDAL } from '../interfaces/rbms.dal.interface';
import { mapCompanyRow, mapModuleRow } from '../common/rbms.mapper';

const FMT = 2;

class OracleBase {
  constructor(protected readonly pool: OraPool) {}

  protected async q<T>(sql: string, binds: Record<string, unknown> = {}) {
    const conn = await this.pool.getConnection();
    try {
      return await conn.execute<T>(sql, binds as any, { outFormat: FMT });
    } finally {
      await conn.close();
    }
  }
}

export class OracleCompanyOrUtilityDAL extends OracleBase implements ICompanyOrUtilityDAL {
  async findAll(activeOnly = true): Promise<ICompanyOrUtility[]> {
    const result = await this.q<Record<string, unknown>>(`SELECT id, name, code, type, description, is_active, created_at, updated_at FROM company_or_utilities ${activeOnly ? 'WHERE is_active = 1' : ''} ORDER BY name`);
    return (result.rows ?? []).map(mapCompanyRow);
  }

  async findById(id: string): Promise<ICompanyOrUtility | null> {
    const result = await this.q<Record<string, unknown>>('SELECT id, name, code, type, description, is_active, created_at, updated_at FROM company_or_utilities WHERE id = :id', { id });
    return result.rows?.[0] ? mapCompanyRow(result.rows[0]) : null;
  }

  async findByCode(code: string): Promise<ICompanyOrUtility | null> {
    const result = await this.q<Record<string, unknown>>('SELECT id, name, code, type, description, is_active, created_at, updated_at FROM company_or_utilities WHERE code = :code', { code });
    return result.rows?.[0] ? mapCompanyRow(result.rows[0]) : null;
  }

  async create(data: CreateCompanyOrUtilityDTO): Promise<ICompanyOrUtility> {
    const id = uuidv4();
    await this.q('INSERT INTO company_or_utilities (id, name, code, type, description, is_active, created_at, updated_at) VALUES (:id, :name, :code, :type, :description, 1, SYSTIMESTAMP, SYSTIMESTAMP)', {
      id, name: data.name, code: data.code, type: data.type ?? 'company', description: data.description ?? null,
    });
    return (await this.findById(id))!;
  }

  async update(id: string, data: UpdateCompanyOrUtilityDTO): Promise<ICompanyOrUtility | null> {
    const sets: string[] = ['updated_at = SYSTIMESTAMP'];
    const binds: Record<string, unknown> = { id };
    const fieldMap: Record<string, string> = { name: 'name', code: 'code', type: 'type', description: 'description' };
    for (const [key, col] of Object.entries(fieldMap)) {
      if (key in data) { binds[key] = (data as Record<string, unknown>)[key]; sets.push(`${col} = :${key}`); }
    }
    if (data.isActive !== undefined) { binds.active = data.isActive ? 1 : 0; sets.push('is_active = :active'); }
    await this.q(`UPDATE company_or_utilities SET ${sets.join(', ')} WHERE id = :id`, binds);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.q('UPDATE company_or_utilities SET is_active = 0, updated_at = SYSTIMESTAMP WHERE id = :id', { id });
    return (result.rowsAffected ?? 0) > 0;
  }
}

export class OracleModuleMenuDAL extends OracleBase implements IModuleMenuDAL {
  async findAll(activeOnly = true): Promise<IModuleMenu[]> {
    const result = await this.q<Record<string, unknown>>(`SELECT id, name, code, route, icon, parent_id, sort_order, permissions, is_active, created_at, updated_at FROM module_menus ${activeOnly ? 'WHERE is_active = 1' : ''} ORDER BY sort_order, name`);
    return (result.rows ?? []).map(mapModuleRow);
  }

  async findById(id: string): Promise<IModuleMenu | null> {
    const result = await this.q<Record<string, unknown>>('SELECT id, name, code, route, icon, parent_id, sort_order, permissions, is_active, created_at, updated_at FROM module_menus WHERE id = :id', { id });
    return result.rows?.[0] ? mapModuleRow(result.rows[0]) : null;
  }

  async findByCode(code: string): Promise<IModuleMenu | null> {
    const result = await this.q<Record<string, unknown>>('SELECT id, name, code, route, icon, parent_id, sort_order, permissions, is_active, created_at, updated_at FROM module_menus WHERE code = :code', { code });
    return result.rows?.[0] ? mapModuleRow(result.rows[0]) : null;
  }

  async create(data: CreateModuleMenuDTO): Promise<IModuleMenu> {
    const id = uuidv4();
    await this.q('INSERT INTO module_menus (id, name, code, route, icon, parent_id, sort_order, permissions, is_active, created_at, updated_at) VALUES (:id, :name, :code, :route, :icon, :parentId, :sortOrder, :permissions, 1, SYSTIMESTAMP, SYSTIMESTAMP)', {
      id, name: data.name, code: data.code, route: data.route, icon: data.icon ?? null,
      parentId: data.parentId || null, sortOrder: data.sortOrder ?? 0, permissions: JSON.stringify(data.permissions ?? []),
    });
    return (await this.findById(id))!;
  }

  async update(id: string, data: UpdateModuleMenuDTO): Promise<IModuleMenu | null> {
    const sets: string[] = ['updated_at = SYSTIMESTAMP'];
    const binds: Record<string, unknown> = { id };
    const fieldMap: Record<string, string> = { name: 'name', code: 'code', route: 'route', icon: 'icon', parentId: 'parent_id', sortOrder: 'sort_order' };
    for (const [key, col] of Object.entries(fieldMap)) {
      if (key in data) { binds[key] = (data as Record<string, unknown>)[key]; sets.push(`${col} = :${key}`); }
    }
    if (data.permissions !== undefined) { binds.permissions = JSON.stringify(data.permissions); sets.push('permissions = :permissions'); }
    if (data.isActive !== undefined) { binds.active = data.isActive ? 1 : 0; sets.push('is_active = :active'); }
    await this.q(`UPDATE module_menus SET ${sets.join(', ')} WHERE id = :id`, binds);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.q('UPDATE module_menus SET is_active = 0, updated_at = SYSTIMESTAMP WHERE id = :id', { id });
    return (result.rowsAffected ?? 0) > 0;
  }
}
