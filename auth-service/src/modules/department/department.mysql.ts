import { getMysqlPool } from '../../database/adapters/db.connection';
import { IDepartmentRepository } from './department.interface';
import {
  IDepartment,
  CreateDepartmentDTO,
  UpdateDepartmentDTO,
} from './department.types';

import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { v4 as uuid } from 'uuid';

export class MysqlDepartmentRepository
  implements IDepartmentRepository
{
  private async pool() {
    return getMysqlPool();
  }

  async findAll(): Promise<IDepartment[]> {
    const pool = await this.pool();

    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM departments'
    );

    return rows as IDepartment[];
  }

  async findById(id: string): Promise<IDepartment | null> {
    const pool = await this.pool();

    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM departments WHERE id = ?',
      [id]
    );

    return (rows as IDepartment[])[0] ?? null;
  }

  async create(data: CreateDepartmentDTO): Promise<IDepartment> {
    const pool = await this.pool();

    const id = uuid();
    const now = new Date();

    await pool.query<ResultSetHeader>(
      `INSERT INTO departments
       (id, name, code, parentId, managerId, description, isActive, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.name,
        data.code,
        data.parentId ?? null,
        data.managerId ?? null,
        data.description ?? null,
        1,
        now,
        now,
      ]
    );

    return {
      id,
      ...data,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
  }

  async update(
    id: string,
    data: UpdateDepartmentDTO
  ): Promise<IDepartment | null> {
    const pool = await this.pool();

    const fields: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      fields.push('name = ?');
      values.push(data.name);
    }

    if (data.code !== undefined) {
      fields.push('code = ?');
      values.push(data.code);
    }

    if (data.parentId !== undefined) {
      fields.push('parentId = ?');
      values.push(data.parentId);
    }

    if (data.managerId !== undefined) {
      fields.push('managerId = ?');
      values.push(data.managerId);
    }

    if (data.description !== undefined) {
      fields.push('description = ?');
      values.push(data.description);
    }

    if (data.isActive !== undefined) {
      fields.push('isActive = ?');
      values.push(data.isActive ? 1 : 0);
    }

    fields.push('updatedAt = ?');
    values.push(new Date());

    values.push(id);

    await pool.query<ResultSetHeader>(
      `UPDATE departments SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const pool = await this.pool();

    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM departments WHERE id = ?',
      [id]
    );

    return result.affectedRows > 0;
  }
}