import { getMssqlPool } from '../../database/adapters/db.connection';
import { IDepartmentRepository } from './department.interface';
import {
  IDepartment,
  CreateDepartmentDTO,
  UpdateDepartmentDTO,
} from './department.types';
import { v4 as uuid } from 'uuid';

export class MssqlDepartmentRepository
  implements IDepartmentRepository
{
  async findAll(): Promise<IDepartment[]> {
    const pool = await getMssqlPool();
    const result = await pool.request().execute('sp_GetAllDepartments');
    return result.recordset;
  }

  async findById(id: string): Promise<IDepartment | null> {
    const pool = await getMssqlPool();
    const result = await pool
      .request()
      .input('id', id)
      .query('SELECT * FROM departments WHERE id = @id');

    return result.recordset[0] ?? null;
  }

  async create(data: CreateDepartmentDTO): Promise<IDepartment> {
    const pool = await getMssqlPool();
    const id = uuid();

    const result = await pool.request()
      .input('id', id)
      .input('name', data.name)
      .input('code', data.code)
      .input('description', data.description ?? null)
      .execute('sp_CreateDepartment');

    return result.recordset[0];
  }

  // ✅ FIXED UPDATE
  async update(
    id: string,
    data: UpdateDepartmentDTO
  ): Promise<IDepartment | null> {
    const pool = await getMssqlPool();

    const request = pool.request().input('id', id);

    if (data.name !== undefined)
      request.input('name', data.name);

    if (data.code !== undefined)
      request.input('code', data.code);

    if (data.description !== undefined)
      request.input('description', data.description);

    if (data.isActive !== undefined)
      request.input('isActive', data.isActive);

    const result = await request.execute('sp_UpdateDepartment');

    return result.recordset[0] ?? null;
  }

  async delete(id: string): Promise<boolean> {
    const pool = await getMssqlPool();

    const result = await pool
      .request()
      .input('id', id)
      .query('DELETE FROM departments WHERE id = @id');

    return result.rowsAffected[0] > 0;
  }
}