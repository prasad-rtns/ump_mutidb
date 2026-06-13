import { DatabaseType } from '@rtns/core';
import { drizzle as pgDrizzle } from 'drizzle-orm/node-postgres';
import { getPgPool, getMssqlPool, getOraclePool, getMongoClient, getMysqlDB } from '../database/adapters/db.connection';
import { PgUserDAL } from './pg/user.dal.pg';
import { PgSessionDAL } from './pg/session.dal.pg';
import { PgRoleDAL, PgDepartmentDAL, PgDesignationDAL } from './pg/role-dept-desig.dal.pg';
import { PgCompanyOrUtilityDAL, PgModuleMenuDAL } from './pg/rbms.dal.pg';
import { MssqlUserDAL } from './mssql/user.dal.mssql';
import { MssqlSessionDAL, MssqlRoleDAL, MssqlDepartmentDAL, MssqlDesignationDAL } from './mssql/others.dal.mssql';
import { MssqlCompanyOrUtilityDAL, MssqlModuleMenuDAL } from './mssql/rbms.dal.mssql';
import { OracleUserDAL } from './oracle/user.dal.oracle';
import { OracleSessionDAL, OracleRoleDAL, OracleDepartmentDAL, OracleDesignationDAL } from './oracle/others.dal.oracle';
import { OracleCompanyOrUtilityDAL, OracleModuleMenuDAL } from './oracle/rbms.dal.oracle';
import { MongoUserDAL } from './mongo/user.dal.mongo';
import { MongoSessionDAL, MongoRoleDAL, MongoDepartmentDAL, MongoDesignationDAL } from './mongo/others.dal.mongo';
import { MongoCompanyOrUtilityDAL, MongoModuleMenuDAL } from './mongo/rbms.dal.mongo';
import { MysqlUserDAL, MysqlSessionDAL, MysqlRoleDAL, MysqlDepartmentDAL, MysqlDesignationDAL } from './mysql/auth.dal.mysql';
import { MysqlCompanyOrUtilityDAL, MysqlModuleMenuDAL } from './mysql/rbms.dal.mysql';

export type { IUserDAL } from './interfaces/user.dal.interface';
export type { ISessionDAL } from './interfaces/session.dal.interface';
export type { IRoleDAL, IDepartmentDAL, IDesignationDAL } from './interfaces/role-dept-desig.dal.interface';
export type { ICompanyOrUtilityDAL, IModuleMenuDAL } from './interfaces/rbms.dal.interface';

export interface DALBundle {
  user: import('./interfaces/user.dal.interface').IUserDAL;
  session: import('./interfaces/session.dal.interface').ISessionDAL;
  role: import('./interfaces/role-dept-desig.dal.interface').IRoleDAL;
  department: import('./interfaces/role-dept-desig.dal.interface').IDepartmentDAL;
  designation: import('./interfaces/role-dept-desig.dal.interface').IDesignationDAL;
  company: import('./interfaces/rbms.dal.interface').ICompanyOrUtilityDAL;
  moduleMenu: import('./interfaces/rbms.dal.interface').IModuleMenuDAL;
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
          company: new MongoCompanyOrUtilityDAL(collections),
          moduleMenu: new MongoModuleMenuDAL(collections),
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
          company: new MssqlCompanyOrUtilityDAL(pool),
          moduleMenu: new MssqlModuleMenuDAL(pool),
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
          company: new OracleCompanyOrUtilityDAL(pool),
          moduleMenu: new OracleModuleMenuDAL(pool),
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
          company: new MysqlCompanyOrUtilityDAL(db),
          moduleMenu: new MysqlModuleMenuDAL(db),
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
          company: new PgCompanyOrUtilityDAL(db),
          moduleMenu: new PgModuleMenuDAL(db),
        };
      }
    }
  }
}
