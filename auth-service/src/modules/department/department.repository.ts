import { DatabaseType } from '@prasad-rtns/shared';
import { IDepartmentRepository } from './department.interface';

import { PgDepartmentRepository } from './department.pg';
import { MssqlDepartmentRepository } from './department.mssql';
import { MongoDepartmentRepository } from './department.mongo';
import { MysqlDepartmentRepository } from './department.mysql';
import { OracleDepartmentRepository } from './department.oracle';

export function createDepartmentRepository(
  dbType: DatabaseType
): IDepartmentRepository {

  switch (dbType) {
    case 'postgres':
      return new PgDepartmentRepository();

    case 'mysql':
      return new MysqlDepartmentRepository();

    case 'mssql':
      return new MssqlDepartmentRepository();

    case 'oracle':
      return new OracleDepartmentRepository();

    case 'mongodb':
      return new MongoDepartmentRepository();

    default:
      throw new Error(`Unsupported DB type: ${dbType}`);
  }
}