import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDbConnection } from '../database/connection';
import { auditLogs } from '../schemas/pg.schema';
import { DatabaseType } from '@prasad-rtns/shared'; 

export const auditLog = (action: string, entity: string) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    // Store original body for before/after comparison
    (req as Request & { _auditAction: string; _auditEntity: string })._auditAction = action;
    (req as Request & { _auditAction: string; _auditEntity: string })._auditEntity = entity;
    next();
  };
};

export const writeAuditLog = async (
  userId: string | undefined,
  action: string,
  entity: string,
  entityId: string | undefined,
  oldValues: Record<string, unknown> | undefined,
  newValues: Record<string, unknown> | undefined,
  ipAddress: string | undefined,
  userAgent: string | undefined,
  dbType: string = 'postgres'
) => {
  try {
    const conn = await getDbConnection(dbType as 'postgres' | 'mysql' | 'mssql' | 'oracle' | 'mongodb');

    if (dbType === 'mongodb') {
      const { collections } = conn as { collections: import('../schemas/mongo.schema').MongoCollections };
      await collections.auditLogs.insertOne({
        id: uuidv4(),
        userId,
        action,
        entity,
        entityId,
        oldValues,
        newValues,
        ipAddress,
        userAgent,
        createdAt: new Date(),
      });
      return;
    }

    if (conn.type !== 'postgres') {
      throw new Error('Audit log requires Postgres');
    }

    await conn.db.insert(auditLogs).values({
        id: uuidv4(),
        userId,
        action,
        entity,
        entityId,
        oldValues: oldValues ? oldValues : undefined,
        newValues: newValues ? newValues : undefined,
        ipAddress,
        userAgent,
        createdAt: new Date(),
      });
  } catch (err) {
    // Non-blocking - log error but don't fail request
    console.error('Audit log write failed:', err);
  }
};
