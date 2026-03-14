import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';

import { getPgPool } from '../../database/adapters/db.connection';
import { departments, pgSchema } from '../../schemas/pg.schema';

import { IDepartmentRepository } from './department.interface';
import { CreateDepartmentDTO, UpdateDepartmentDTO, IDepartment } from './department.types';

export class PgDepartmentRepository implements IDepartmentRepository {
  private async db() {
    const pool = await getPgPool();
    return drizzle(pool, { schema: pgSchema });
  }

  async findAll(): Promise<IDepartment[]> {
    const db = await this.db();
    return db.select().from(departments) as any;
  }

  async findById(id: string) {
    const db = await this.db();
    const rows = await db.select().from(departments).where(eq(departments.id, id));
    return rows[0] ?? null;
  }

  async create(data: CreateDepartmentDTO) {
    const db = await this.db();
    const rows = await db.insert(departments).values({
      id: uuid(),
      ...data,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return rows[0] as any;
  }

  async update(id: string, data: UpdateDepartmentDTO) {
    const db = await this.db();
    const rows = await db.update(departments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(departments.id, id))
      .returning();
    return rows[0] ?? null;
  }

  async delete(id: string) {
    const db = await this.db();
    const result = await db.delete(departments)
      .where(eq(departments.id, id))
      .returning();
    return result.length > 0;
  }
}