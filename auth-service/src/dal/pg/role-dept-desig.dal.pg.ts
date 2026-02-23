import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { roles, departments, designations } from '../../schemas/pg.schema';
import { IRoleDAL, IDepartmentDAL, IDesignationDAL } from '../interfaces/role-dept-desig.dal.interface';
import { Role, Department, Designation, CreateRoleDTO, UpdateRoleDTO, CreateDepartmentDTO, UpdateDepartmentDTO, CreateDesignationDTO, UpdateDesignationDTO } from '../../types';

type PgDB = NodePgDatabase<Record<string, never>>;

// ─── Role DAL ─────────────────────────────────────────────────────────────────
export class PgRoleDAL implements IRoleDAL {
  constructor(private readonly db: PgDB) {}

  async findAll(activeOnly = true): Promise<Role[]> {
    const where = activeOnly ? eq(roles.isActive, true) : undefined;
    const rows = await this.db.select().from(roles).where(where);
    return rows as unknown as Role[];
  }

  async findById(id: string): Promise<Role | null> {
    const rows = await this.db.select().from(roles).where(eq(roles.id, id)).limit(1);
    return (rows[0] as unknown as Role) ?? null;
  }

  async findBySlug(slug: Role['slug']): Promise<Role | null> {
    const rows = await this.db.select().from(roles).where(eq(roles.slug, slug)).limit(1);
    return (rows[0] as unknown as Role) ?? null;
  }

  async create(data: CreateRoleDTO): Promise<Role> {
    const now = new Date();
    const rows = await this.db.insert(roles).values({
      id: uuidv4(), ...(data as any),
      permissions: data.permissions ?? [], isActive: true, createdAt: now, updatedAt: now,
    }).returning();
    return rows[0] as unknown as Role;
  }

  async update(id: string, data: UpdateRoleDTO): Promise<Role | null> {
    const rows = await this.db
      .update(roles)
      .set({ ...(data as any), updatedAt: new Date() })
      .where(eq(roles.id, id)).returning();
    return (rows[0] as unknown as Role) ?? null;
  }

  async delete(id: string): Promise<boolean> {
    const rows = await this.db.update(roles).set({ isActive: false, updatedAt: new Date() }).where(eq(roles.id, id)).returning({ id: roles.id });
    return rows.length > 0;
  }
}

// ─── Department DAL ───────────────────────────────────────────────────────────
export class PgDepartmentDAL implements IDepartmentDAL {
  constructor(private readonly db: PgDB) {}

  async findAll(activeOnly = true): Promise<Department[]> {
    const where = activeOnly ? eq(departments.isActive, true) : undefined;
    const rows = await this.db.select().from(departments).where(where);
    return rows as unknown as Department[];
  }

  async findById(id: string): Promise<Department | null> {
    const rows = await this.db.select().from(departments).where(eq(departments.id, id)).limit(1);
    return (rows[0] as unknown as Department) ?? null;
  }

  async findByCode(code: string): Promise<Department | null> {
    const rows = await this.db.select().from(departments).where(eq(departments.code, code)).limit(1);
    return (rows[0] as unknown as Department) ?? null;
  }

  async findChildren(parentId: string): Promise<Department[]> {
    const rows = await this.db.select().from(departments)
      .where(eq(departments.parentId, parentId));
    return rows as unknown as Department[];
  }

  async create(data: CreateDepartmentDTO): Promise<Department> {
    const now = new Date();
    const rows = await this.db.insert(departments).values({
      id: uuidv4(), ...(data as any),
      isActive: true, createdAt: now, updatedAt: now,
    }).returning();
    return rows[0] as unknown as Department;
  }

  async update(id: string, data: UpdateDepartmentDTO): Promise<Department | null> {
    const rows = await this.db
      .update(departments)
      .set({ ...(data as any), updatedAt: new Date() })
      .where(eq(departments.id, id)).returning();
    return (rows[0] as unknown as Department) ?? null;
  }

  async delete(id: string): Promise<boolean> {
    const rows = await this.db.update(departments).set({ isActive: false, updatedAt: new Date() }).where(eq(departments.id, id)).returning({ id: departments.id });
    return rows.length > 0;
  }
}

// ─── Designation DAL ──────────────────────────────────────────────────────────
export class PgDesignationDAL implements IDesignationDAL {
  constructor(private readonly db: PgDB) {}

  async findAll(activeOnly = true): Promise<Designation[]> {
    const where = activeOnly ? eq(designations.isActive, true) : undefined;
    const rows = await this.db.select().from(designations).where(where);
    return rows as unknown as Designation[];
  }

  async findByDepartment(departmentId: string, activeOnly = true): Promise<Designation[]> {
    const where = activeOnly
      ? eq(designations.departmentId, departmentId)
      : eq(designations.departmentId, departmentId);
    const rows = await this.db.select().from(designations).where(where);
    return rows as unknown as Designation[];
  }

  async findById(id: string): Promise<Designation | null> {
    const rows = await this.db.select().from(designations).where(eq(designations.id, id)).limit(1);
    return (rows[0] as unknown as Designation) ?? null;
  }

  async findByCode(code: string): Promise<Designation | null> {
    const rows = await this.db.select().from(designations).where(eq(designations.code, code)).limit(1);
    return (rows[0] as unknown as Designation) ?? null;
  }

  async create(data: CreateDesignationDTO): Promise<Designation> {
    const now = new Date();
    const rows = await this.db.insert(designations).values({
      id: uuidv4(), ...(data as any),
      level: data.level ?? 1, isActive: true, createdAt: now, updatedAt: now,
    }).returning();
    return rows[0] as unknown as Designation;
  }

  async update(id: string, data: UpdateDesignationDTO): Promise<Designation | null> {
    const rows = await this.db
      .update(designations)
      .set({ ...(data as any), updatedAt: new Date() })
      .where(eq(designations.id, id)).returning();
    return (rows[0] as unknown as Designation) ?? null;
  }

  async delete(id: string): Promise<boolean> {
    const rows = await this.db.update(designations).set({ isActive: false, updatedAt: new Date() }).where(eq(designations.id, id)).returning({ id: designations.id });
    return rows.length > 0;
  }
}
