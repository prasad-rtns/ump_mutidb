import { eq, and, lt } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { sessions } from '../../schemas/pg.schema';
import { ISessionDAL } from '../interfaces/session.dal.interface';
import { Session, CreateSessionDTO } from '../../types';

type PgDB = NodePgDatabase<Record<string, never>>;

export class PgSessionDAL implements ISessionDAL {
  constructor(private readonly db: PgDB) {}

  async create(data: CreateSessionDTO): Promise<Session> {
    const rows = await this.db
      .insert(sessions)
      .values({ id: uuidv4(), ...(data as any), isRevoked: false, createdAt: new Date() })
      .returning();
    return rows[0] as unknown as Session;
  }

  async findByRefreshToken(token: string): Promise<Session | null> {
    const rows = await this.db
      .select()
      .from(sessions)
      .where(and(eq(sessions.refreshToken, token), eq(sessions.isRevoked, false)))
      .limit(1);
    return (rows[0] as unknown as Session) ?? null;
  }

  async findActiveByUserId(userId: string): Promise<Session[]> {
    const rows = await this.db
      .select()
      .from(sessions)
      .where(and(eq(sessions.userId, userId), eq(sessions.isRevoked, false)));
    return rows as unknown as Session[];
  }

  async revokeByToken(token: string): Promise<void> {
    await this.db.update(sessions).set({ isRevoked: true }).where(eq(sessions.refreshToken, token));
  }

  async revokeAllByUserId(userId: string): Promise<void> {
    await this.db.update(sessions).set({ isRevoked: true }).where(eq(sessions.userId, userId));
  }

  async deleteExpired(): Promise<number> {
    const rows = await this.db
      .delete(sessions)
      .where(lt(sessions.expiresAt, new Date()))
      .returning({ id: sessions.id });
    return rows.length;
  }
}
