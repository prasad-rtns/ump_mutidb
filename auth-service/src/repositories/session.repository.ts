import { eq, and, lt } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { getDbConnection } from '../database/connection';
import { sessions } from '../schemas/pg.schema';
import { DatabaseType } from '@prasad-rtns/shared';
import { ISession } from './types';

export class SessionRepository {
  private dbType: DatabaseType;

  constructor(dbType: DatabaseType = 'postgres') {
    this.dbType = dbType;
  }

  async create(data: Omit<ISession, 'id' | 'createdAt'>): Promise<ISession> {
    const conn = await getDbConnection(this.dbType);

    if (this.dbType === 'mongodb') {
      const { collections } = conn as { collections: import('../schemas/mongo.schema').MongoCollections };
      const doc = { id: uuidv4(), ...(data as any), createdAt: new Date() };
      await collections.sessions.insertOne(doc);
      return doc as ISession;
    }

    const { db } = conn as { db: ReturnType<typeof import('drizzle-orm/node-postgres').drizzle> };
    const result = await (db as ReturnType<typeof import('drizzle-orm/node-postgres').drizzle>)
      .insert(sessions).values({ id: uuidv4(), ...(data as any), createdAt: new Date() }).returning();
    return (result as ISession[])[0];
  }

  async findByRefreshToken(token: string): Promise<ISession | null> {
    const conn = await getDbConnection(this.dbType);

    if (this.dbType === 'mongodb') {
      const { collections } = conn as { collections: import('../schemas/mongo.schema').MongoCollections };
      const s = await collections.sessions.findOne({ refreshToken: token, isRevoked: false });
      return s as unknown as ISession | null;
    }

    const { db } = conn as { db: ReturnType<typeof import('drizzle-orm/node-postgres').drizzle> };
    const result = await (db as ReturnType<typeof import('drizzle-orm/node-postgres').drizzle>)
      .select().from(sessions).where(and(eq(sessions.refreshToken, token), eq(sessions.isRevoked, false))).limit(1);
    return (result as ISession[])[0] || null;
  }

  async revokeByToken(token: string): Promise<void> {
    const conn = await getDbConnection(this.dbType);

    if (this.dbType === 'mongodb') {
      const { collections } = conn as { collections: import('../schemas/mongo.schema').MongoCollections };
      await collections.sessions.updateOne({ refreshToken: token }, { $set: { isRevoked: true } });
      return;
    }

    const { db } = conn as { db: ReturnType<typeof import('drizzle-orm/node-postgres').drizzle> };
    await (db as ReturnType<typeof import('drizzle-orm/node-postgres').drizzle>)
      .update(sessions).set({ isRevoked: true }).where(eq(sessions.refreshToken, token));
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    const conn = await getDbConnection(this.dbType);

    if (this.dbType === 'mongodb') {
      const { collections } = conn as { collections: import('../schemas/mongo.schema').MongoCollections };
      await collections.sessions.updateMany({ userId }, { $set: { isRevoked: true } });
      return;
    }

    const { db } = conn as { db: ReturnType<typeof import('drizzle-orm/node-postgres').drizzle> };
    await (db as ReturnType<typeof import('drizzle-orm/node-postgres').drizzle>)
      .update(sessions).set({ isRevoked: true }).where(eq(sessions.userId, userId));
  }

  async cleanupExpired(): Promise<void> {
    const conn = await getDbConnection(this.dbType);

    if (this.dbType === 'mongodb') {
      const { collections } = conn as { collections: import('../schemas/mongo.schema').MongoCollections };
      await collections.sessions.deleteMany({ expiresAt: { $lt: new Date() } });
      return;
    }

    const { db } = conn as { db: ReturnType<typeof import('drizzle-orm/node-postgres').drizzle> };
    await (db as ReturnType<typeof import('drizzle-orm/node-postgres').drizzle>)
      .delete(sessions).where(lt(sessions.expiresAt, new Date()));
  }
}
