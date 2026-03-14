import { v4 as uuid } from 'uuid';
import { getOraclePool } from '../../database/adapters/db.connection';
import oracledb from 'oracledb';
import { IDepartmentRepository } from './department.interface';
import {
  IDepartment,
  CreateDepartmentDTO,
  UpdateDepartmentDTO,
} from './department.types';

export class OracleDepartmentRepository
  implements IDepartmentRepository
{
  async findAll(): Promise<IDepartment[]> {
    const pool = await getOraclePool();
    const conn = await pool.getConnection();

    const result = await conn.execute(
      `SELECT * FROM departments`
    );

    await conn.close();

    return result.rows as IDepartment[];
  }

  async findById(id: string): Promise<IDepartment | null> {
    const pool = await getOraclePool();
    const conn = await pool.getConnection();

    const result = await conn.execute(
      `SELECT * FROM departments WHERE id = :id`,
      { id }
    );

    await conn.close();

    return (result.rows as IDepartment[])[0] ?? null;
  }

  async create(data: CreateDepartmentDTO): Promise<IDepartment> {
    const pool = await getOraclePool();
    const conn = await pool.getConnection();

    const id = uuid();
    const now = new Date();

    await conn.execute(
      `INSERT INTO departments
       (id, name, code, parentId, managerId, description, isActive, createdAt, updatedAt)
       VALUES (:id, :name, :code, :parentId, :managerId, :description, :isActive, :createdAt, :updatedAt)`,
      {
        id,
        name: data.name,
        code: data.code,
        parentId: data.parentId ?? null,
        managerId: data.managerId ?? null,
        description: data.description ?? null,
        isActive: 1,
        createdAt: now,
        updatedAt: now,
      }
    );

    await conn.close();

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
  const pool = await getOraclePool();
  const conn = await pool.getConnection();

  const binds: oracledb.BindParameters = {
    id,
    name: data.name ?? null,
    code: data.code ?? null,
    description: data.description ?? null,
    isActive:
      data.isActive !== undefined
        ? data.isActive ? 1 : 0
        : null,
  };

  await conn.execute(
    `
    UPDATE departments
    SET name = NVL(:name, name),
        code = NVL(:code, code),
        description = NVL(:description, description),
        isActive = NVL(:isActive, isActive),
        updatedAt = SYSDATE
    WHERE id = :id
    `,
    binds,
    { autoCommit: true }
  );

  await conn.close();

  return this.findById(id);
}

  async delete(id: string): Promise<boolean> {
    const pool = await getOraclePool();
    const conn = await pool.getConnection();

    const result = await conn.execute(
      `DELETE FROM departments WHERE id = :id`,
      { id }
    );

    await conn.close();

    return (result.rowsAffected ?? 0) > 0;
  }
}