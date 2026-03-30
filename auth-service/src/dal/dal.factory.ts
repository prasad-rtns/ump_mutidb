import { DatabaseType } from '@prasad-rtns/shared';
import { drizzle as pgDrizzle } from 'drizzle-orm/node-postgres';
import { getPgPool, getMssqlPool, getOraclePool, getMongoClient, getMysqlDB } from '../database/adapters/db.connection';
import { PgUserDAL } from './pg/user.dal.pg';
import { PgSessionDAL } from './pg/session.dal.pg';
import { PgRoleDAL, PgDepartmentDAL, PgDesignationDAL } from './pg/role-dept-desig.dal.pg';
import { MssqlUserDAL } from './mssql/user.dal.mssql';
import { MssqlSessionDAL, MssqlRoleDAL, MssqlDepartmentDAL, MssqlDesignationDAL } from './mssql/others.dal.mssql';
import { OracleUserDAL } from './oracle/user.dal.oracle';
import { OracleSessionDAL, OracleRoleDAL, OracleDepartmentDAL, OracleDesignationDAL } from './oracle/others.dal.oracle';
import { MongoUserDAL } from './mongo/user.dal.mongo';
import { MongoSessionDAL, MongoRoleDAL, MongoDepartmentDAL, MongoDesignationDAL } from './mongo/others.dal.mongo';
import { MysqlUserDAL, MysqlSessionDAL, MysqlRoleDAL, MysqlDepartmentDAL, MysqlDesignationDAL } from './mysql/auth.dal.mysql';

export type { IUserDAL } from './interfaces/user.dal.interface';
export type { ISessionDAL } from './interfaces/session.dal.interface';
export type { IRoleDAL, IDepartmentDAL, IDesignationDAL } from './interfaces/role-dept-desig.dal.interface';

export interface DALBundle {
  user: import('./interfaces/user.dal.interface').IUserDAL;
  session: import('./interfaces/session.dal.interface').ISessionDAL;
  role: import('./interfaces/role-dept-desig.dal.interface').IRoleDAL;
  department: import('./interfaces/role-dept-desig.dal.interface').IDepartmentDAL;
  designation: import('./interfaces/role-dept-desig.dal.interface').IDesignationDAL;
}

export class DALFactory {
  static async get(dbType: DatabaseType): Promise<DALBundle> {
    switch (dbType) {
      case 'mongodb': {
        const { collections } = await getMongoClient();
        return {
          user: new MongoUserDAL(collections),
          session: new MongoSessionDAL(collections),
          role: new MongoRoleDAL(collections),
          department: new MongoDepartmentDAL(collections),
          designation: new MongoDesignationDAL(collections),
        };
      }

      case 'mssql': {
        const pool = await getMssqlPool();
        return {
          user: new MssqlUserDAL(pool),
          session: new MssqlSessionDAL(pool),
          role: new MssqlRoleDAL(pool),
          department: new MssqlDepartmentDAL(pool),
          designation: new MssqlDesignationDAL(pool),
        };
      }

      case 'oracle': {
        const pool = await getOraclePool();
        return {
          user: new OracleUserDAL(pool),
          session: new OracleSessionDAL(pool),
          role: new OracleRoleDAL(pool),
          department: new OracleDepartmentDAL(pool),
          designation: new OracleDesignationDAL(pool),
        };
      }

      case 'mysql': {
        const db = await getMysqlDB();
        return {
          user: new MysqlUserDAL(db),
          session: new MysqlSessionDAL(db),
          role: new MysqlRoleDAL(db),
          department: new MysqlDepartmentDAL(db),
          designation: new MysqlDesignationDAL(db),
        };
      }

      case 'postgres':
      default: {
        const pool = await getPgPool();
        const db = pgDrizzle(pool);
        return {
          user: new PgUserDAL(db),
          session: new PgSessionDAL(db),
          role: new PgRoleDAL(db),
          department: new PgDepartmentDAL(db),
          designation: new PgDesignationDAL(db),
        };
      }
    }
  }
}
