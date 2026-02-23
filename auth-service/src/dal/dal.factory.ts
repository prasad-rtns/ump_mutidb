import { DatabaseType } from '@prasad-rtns/shared';
import { connectMongo } from '../database/connection';
import { drizzle as pgDrizzle } from 'drizzle-orm/node-postgres';
import { getPgPool, getMssqlPool, getOraclePool } from '../database/adapters/db.connection';

// ── PostgreSQL ─────────────────────────────────────────────────────────────────
import { PgUserDAL }                                    from './pg/user.dal.pg';
import { PgSessionDAL }                                 from './pg/session.dal.pg';
import { PgRoleDAL, PgDepartmentDAL, PgDesignationDAL } from './pg/role-dept-desig.dal.pg';

// ── SQL Server (MSSQL) ─────────────────────────────────────────────────────────
import { MssqlUserDAL }                                              from './mssql/user.dal.mssql';
import { MssqlSessionDAL, MssqlRoleDAL, MssqlDepartmentDAL, MssqlDesignationDAL } from './mssql/others.dal.mssql';

// ── Oracle ─────────────────────────────────────────────────────────────────────
import { OracleUserDAL }                                                 from './oracle/user.dal.oracle';
import { OracleSessionDAL, OracleRoleDAL, OracleDepartmentDAL, OracleDesignationDAL } from './oracle/others.dal.oracle';

// ── MongoDB ────────────────────────────────────────────────────────────────────
import { MongoUserDAL }                                                    from './mongo/user.dal.mongo';
import { MongoSessionDAL, MongoRoleDAL, MongoDepartmentDAL, MongoDesignationDAL } from './mongo/others.dal.mongo';

// ── Interfaces (re-exported for consumers) ─────────────────────────────────────
export type { IUserDAL }        from './interfaces/user.dal.interface';
export type { ISessionDAL }     from './interfaces/session.dal.interface';
export type { IRoleDAL, IDepartmentDAL, IDesignationDAL } from './interfaces/role-dept-desig.dal.interface';

export interface DALBundle {
  user:        import('./interfaces/user.dal.interface').IUserDAL;
  session:     import('./interfaces/session.dal.interface').ISessionDAL;
  role:        import('./interfaces/role-dept-desig.dal.interface').IRoleDAL;
  department:  import('./interfaces/role-dept-desig.dal.interface').IDepartmentDAL;
  designation: import('./interfaces/role-dept-desig.dal.interface').IDesignationDAL;
}

/**
 * DALFactory.get(dbType) returns the correct DAL bundle for the active database.
 * Services receive typed interfaces — they never touch a concrete DB class.
 *
 * Switching DB:  set X-DB-Type header on any request, or change DEFAULT_DB_TYPE env var.
 */
export class DALFactory {
  static async get(dbType: DatabaseType): Promise<DALBundle> {
    switch (dbType) {

      // ─── MongoDB ─────────────────────────────────────────────────────────────
      case 'mongodb': {
        const { collections } = await connectMongo();
        return {
          user:        new MongoUserDAL(collections),
          session:     new MongoSessionDAL(collections),
          role:        new MongoRoleDAL(collections),
          department:  new MongoDepartmentDAL(collections),
          designation: new MongoDesignationDAL(collections),
        };
      }

      // ─── SQL Server ───────────────────────────────────────────────────────────
      case 'mssql': {
        const pool = await getMssqlPool();
        return {
          user:        new MssqlUserDAL(pool),
          session:     new MssqlSessionDAL(pool),
          role:        new MssqlRoleDAL(pool),
          department:  new MssqlDepartmentDAL(pool),
          designation: new MssqlDesignationDAL(pool),
        };
      }

      // ─── Oracle ───────────────────────────────────────────────────────────────
      case 'oracle': {
        const pool = await getOraclePool();
        return {
          user:        new OracleUserDAL(pool),
          session:     new OracleSessionDAL(pool),
          role:        new OracleRoleDAL(pool),
          department:  new OracleDepartmentDAL(pool),
          designation: new OracleDesignationDAL(pool),
        };
      }

      // ─── MySQL ────────────────────────────────────────────────────────────────
      case 'mysql': {
        // MySQL uses Drizzle-compatible schema; falling through to Pg for now.
        // Replace with MysqlUserDAL, etc. once the mysql Drizzle adapter is wired in.
        const pool = await getPgPool();
        const db = pgDrizzle(pool);
        return buildPgBundle(db);
      }

      // ─── PostgreSQL (default) ─────────────────────────────────────────────────
      case 'postgres':
      default: {
        const pool = await getPgPool();
        const db = pgDrizzle(pool);
        return buildPgBundle(db);
      }
    }
  }
}

function buildPgBundle(db: ConstructorParameters<typeof PgUserDAL>[0]): DALBundle {
  return {
    user:        new PgUserDAL(db),
    session:     new PgSessionDAL(db),
    role:        new PgRoleDAL(db),
    department:  new PgDepartmentDAL(db),
    designation: new PgDesignationDAL(db),
  };
}
