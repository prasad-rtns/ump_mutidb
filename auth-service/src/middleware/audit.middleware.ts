import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { drizzle } from 'drizzle-orm/node-postgres';
import { DatabaseType } from '@prasad-rtns/shared';
import {
  getMongoClient,
  getMssqlPool,
  getMysqlPool,
  getOraclePool,
  getPgPool,
} from '../database/adapters/db.connection';
import { auditLogs, pgSchema } from '../schemas/pg.schema';

const toJsonString = (value: Record<string, unknown> | undefined) =>
  value ? JSON.stringify(value) : null;

export const auditLog = (action: string, entity: string) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
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
  dbType: DatabaseType = 'postgres'
) => {
  try {
    const id = uuidv4();
    const createdAt = new Date();
    const oldValuesJson = toJsonString(oldValues);
    const newValuesJson = toJsonString(newValues);

    switch (dbType) {
      case 'mongodb': {
        const { collections } = await getMongoClient();
        await collections.auditLogs.insertOne({
          id,
          userId,
          action,
          entity,
          entityId,
          oldValues,
          newValues,
          ipAddress,
          userAgent,
          createdAt,
        });
        return;
      }

      case 'postgres': {
        const pool = await getPgPool();
        const db = drizzle(pool, { schema: pgSchema });

        await db.insert(auditLogs).values({
          id,
          userId,
          action,
          entity,
          entityId,
          oldValues: oldValues || undefined,
          newValues: newValues || undefined,
          ipAddress,
          userAgent,
          createdAt,
        });
        return;
      }

      case 'mysql': {
        const pool = await getMysqlPool();
        await pool.execute(
          `INSERT INTO audit_logs
            (id, user_id, action, entity, entity_id, old_values, new_values, ip_address, user_agent, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            userId ?? null,
            action,
            entity,
            entityId ?? null,
            oldValuesJson,
            newValuesJson,
            ipAddress ?? null,
            userAgent ?? null,
            createdAt,
          ]
        );
        return;
      }

      case 'mssql': {
        const pool = await getMssqlPool();
        await pool.request()
          .input('id', id)
          .input('userId', userId ?? null)
          .input('action', action)
          .input('entity', entity)
          .input('entityId', entityId ?? null)
          .input('oldValues', oldValuesJson)
          .input('newValues', newValuesJson)
          .input('ipAddress', ipAddress ?? null)
          .input('userAgent', userAgent ?? null)
          .input('createdAt', createdAt)
          .query(`INSERT INTO audit_logs
                    (id, user_id, action, entity, entity_id, old_values, new_values, ip_address, user_agent, created_at)
                  VALUES
                    (@id, @userId, @action, @entity, @entityId, @oldValues, @newValues, @ipAddress, @userAgent, @createdAt)`);
        return;
      }

      case 'oracle': {
        const pool = await getOraclePool();
        const conn = await pool.getConnection();

        try {
          await conn.execute(
            `INSERT INTO audit_logs
              (id, user_id, action, entity, entity_id, old_values, new_values, ip_address, user_agent, created_at)
             VALUES
              (:id, :userId, :action, :entity, :entityId, :oldValues, :newValues, :ipAddress, :userAgent, :createdAt)`,
            {
              id,
              userId: userId ?? null,
              action,
              entity,
              entityId: entityId ?? null,
              oldValues: oldValuesJson,
              newValues: newValuesJson,
              ipAddress: ipAddress ?? null,
              userAgent: userAgent ?? null,
              createdAt,
            }
          );
        } finally {
          await conn.close();
        }

        return;
      }

      default:
        throw new Error(`Unsupported DB type: ${dbType}`);
    }
  } catch (err) {
    console.error('Audit log write failed:', err);
  }
};
