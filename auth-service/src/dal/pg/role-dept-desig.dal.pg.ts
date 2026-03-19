import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { roles, departments, designations } from '../../schemas/pg.schema';
import { IRoleDAL, IDepartmentDAL, IDesignationDAL } from '../interfaces/role-dept-desig.dal.interface';
import { IRole, IDepartment, IDesignation, CreateRoleDTO, UpdateRoleDTO, CreateDepartmentDTO, UpdateDepartmentDTO, CreateDesignationDTO, UpdateDesignationDTO } from '../../modules/master/master.types';

type PgDB = NodePgDatabase<Record<string, never>>;

// ─── Role DAL ─────────────────────────────────────────────────────────────────
export class PgRoleDAL implements IRoleDAL {
  constructor(private readonly db: PgDB) {}

  async findAll(activeOnly = true): Promise<IRole[]> {
    const where = activeOnly ? eq(roles.isActive, true) : undefined;
    const rows = await this.db.select().from(roles).where(where);
    return rows as unknown as IRole[];
  }

  async findById(id: string): Promise<IRole | null> {
    const rows = await this.db.select().from(roles).where(eq(roles.id, id)).limit(1);
    return (rows[0] as unknown as IRole) ?? null;
  }

  async findBySlug(slug: IRole['slug']): Promise<IRole | null> {
    const rows = await this.db.select().from(roles).where(eq(roles.slug, slug)).limit(1);
    return (rows[0] as unknown as IRole) ?? null;
  }

  async create(data: CreateRoleDTO): Promise<IRole> {
    const now = new Date();
    const rows = await this.db.insert(roles).values({
      id: uuidv4(), ...(data as any),
      permissions: data.permissions ?? [], isActive: true, createdAt: now, updatedAt: now,
    }).returning();
    return rows[0] as unknown as IRole;
  }

  async update(id: string, data: UpdateRoleDTO): Promise<IRole | null> {
    const rows = await this.db
      .update(roles)
      .set({ ...(data as any), updatedAt: new Date() })
      .where(eq(roles.id, id)).returning();
    return (rows[0] as unknown as IRole) ?? null;
  }

  async delete(id: string): Promise<boolean> {
    const rows = await this.db.update(roles).set({ isActive: false, updatedAt: new Date() }).where(eq(roles.id, id)).returning({ id: roles.id });
    return rows.length > 0;
  }
}

// ─── Department DAL ───────────────────────────────────────────────────────────
export class PgDepartmentDAL implements IDepartmentDAL {
  constructor(private readonly db: PgDB) {}

  async findAll(activeOnly = true): Promise<IDepartment[]> {
    const where = activeOnly ? eq(departments.isActive, true) : undefined;
    const rows = await this.db.select().from(departments).where(where);
    return rows as unknown as IDepartment[];
  }

  async findById(id: string): Promise<IDepartment | null> {
    const rows = await this.db.select().from(departments).where(eq(departments.id, id)).limit(1);
    return (rows[0] as unknown as IDepartment) ?? null;
  }

  async findByCode(code: string): Promise<IDepartment | null> {
    const rows = await this.db.select().from(departments).where(eq(departments.code, code)).limit(1);
    return (rows[0] as unknown as IDepartment) ?? null;
  }

  async findChildren(parentId: string): Promise<IDepartment[]> {
    const rows = await this.db.select().from(departments)
      .where(eq(departments.parentId, parentId));
    return rows as unknown as IDepartment[];
  }

  async create(data: CreateDepartmentDTO): Promise<IDepartment> {
    const now = new Date();
    const rows = await this.db.insert(departments).values({
      id: uuidv4(), ...(data as any),
      isActive: true, createdAt: now, updatedAt: now,
    }).returning();
    return rows[0] as unknown as IDepartment;
  }

  async update(id: string, data: UpdateDepartmentDTO): Promise<IDepartment | null> {
    const rows = await this.db
      .update(departments)
      .set({ ...(data as any), updatedAt: new Date() })
      .where(eq(departments.id, id)).returning();
    return (rows[0] as unknown as IDepartment) ?? null;
  }

  async delete(id: string): Promise<boolean> {
    const rows = await this.db.update(departments).set({ isActive: false, updatedAt: new Date() }).where(eq(departments.id, id)).returning({ id: departments.id });
    return rows.length > 0;
  }
}

// ─── Designation DAL ──────────────────────────────────────────────────────────
export class PgDesignationDAL implements IDesignationDAL {
  constructor(private readonly db: PgDB) {}

  async findAll(activeOnly = true): Promise<IDesignation[]> {
    const where = activeOnly ? eq(designations.isActive, true) : undefined;
    const rows = await this.db.select().from(designations).where(where);
    return rows as unknown as IDesignation[];
  }

  async findByDepartment(departmentId: string, activeOnly = true): Promise<IDesignation[]> {
    const where = activeOnly
      ? eq(designations.departmentId, departmentId)
      : eq(designations.departmentId, departmentId);
    const rows = await this.db.select().from(designations).where(where);
    return rows as unknown as IDesignation[];
  }

  async findById(id: string): Promise<IDesignation | null> {
    const rows = await this.db.select().from(designations).where(eq(designations.id, id)).limit(1);
    return (rows[0] as unknown as IDesignation) ?? null;
  }

  async findByCode(code: string): Promise<IDesignation | null> {
    const rows = await this.db.select().from(designations).where(eq(designations.code, code)).limit(1);
    return (rows[0] as unknown as IDesignation) ?? null;
  }

  async create(data: CreateDesignationDTO): Promise<IDesignation> {
    const now = new Date();
    const rows = await this.db.insert(designations).values({
      id: uuidv4(), ...(data as any),
      level: data.level ?? 1, isActive: true, createdAt: now, updatedAt: now,
    }).returning();
    return rows[0] as unknown as IDesignation;
  }

  async update(id: string, data: UpdateDesignationDTO): Promise<IDesignation | null> {
    const rows = await this.db
      .update(designations)
      .set({ ...(data as any), updatedAt: new Date() })
      .where(eq(designations.id, id)).returning();
    return (rows[0] as unknown as IDesignation) ?? null;
  }

  async delete(id: string): Promise<boolean> {
    const rows = await this.db.update(designations).set({ isActive: false, updatedAt: new Date() }).where(eq(designations.id, id)).returning({ id: designations.id });
    return rows.length > 0;
  }
}
