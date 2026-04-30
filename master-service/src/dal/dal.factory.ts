import { DatabaseType } from '@prasad-rtns/shared';
import { drizzle as pgDrizzle } from 'drizzle-orm/node-postgres';

import type {
  ICountryDAL,
  IStateDAL,
  ICityDAL,
  ICategoryDAL,
  ITagDAL,
  IDocumentTypeDAL,
  ISettingDAL,
  IServiceTypeDAL
} from './interfaces/master.dal.interfaces';

import {
  getPgPool,
  getMssqlPool,
  getOraclePool,
  getMongoClient,
  getMysqlPool,
  getMysqlDB
} from '../database/adapters/db.connection';

import {
  PgCountryDAL,
  PgStateDAL,
  PgCityDAL,
  PgCategoryDAL,
  PgTagDAL,
  PgDocumentTypeDAL,
  PgSettingDAL,
  PgServiceTypeDAL
} from './pg/master.dal.pg';

import {
  MysqlCountryDAL,
  MysqlStateDAL,
  MysqlCityDAL,
  MysqlCategoryDAL,
  MysqlTagDAL,
  MysqlDocumentTypeDAL,
  MysqlSettingDAL,
  MysqlServiceTypeDAL
} from './mysql/master.dal.mysql';

import {
  MssqlCountryDAL,
  MssqlStateDAL,
  MssqlCityDAL,
  MssqlCategoryDAL,
  MssqlTagDAL,
  MssqlDocumentTypeDAL,
  MssqlSettingDAL,
  MssqlServiceTypeDAL
} from './mssql/master.dal.mssql';

import {
  OracleCountryDAL,
  OracleStateDAL,
  OracleCityDAL,
  OracleCategoryDAL,
  OracleTagDAL,
  OracleDocumentTypeDAL,
  OracleSettingDAL,
  OracleServiceTypeDAL
} from './oracle/master.dal.oracle';

import {
  MongoCountryDAL,
  MongoStateDAL,
  MongoCityDAL,
  MongoCategoryDAL,
  MongoTagDAL,
  MongoDocumentTypeDAL,
  MongoSettingDAL,
  MongoServiceTypeDAL
} from './mongo/master.dal.mongo';

export interface MasterDALBundle {
  country: ICountryDAL;
  state: IStateDAL;
  city: ICityDAL;
  category: ICategoryDAL;
  tag: ITagDAL;
  documentType: IDocumentTypeDAL;
  setting: ISettingDAL;
  serviceType: IServiceTypeDAL;
}

export class MasterDALFactory {
  static async get(dbType: DatabaseType): Promise<MasterDALBundle> {

    switch (dbType) {

      case 'mongodb': {
        const { db } = await getMongoClient();
        return {
          country: new MongoCountryDAL(db),
          state: new MongoStateDAL(db),
          city: new MongoCityDAL(db),
          category: new MongoCategoryDAL(db),
          tag: new MongoTagDAL(db),
          documentType: new MongoDocumentTypeDAL(db),
          setting: new MongoSettingDAL(db),
          serviceType: new MongoServiceTypeDAL(db),
        };
      }

      case 'mssql': {
        const pool = await getMssqlPool();
        return {
          country: new MssqlCountryDAL(pool),
          state: new MssqlStateDAL(pool),
          city: new MssqlCityDAL(pool),
          category: new MssqlCategoryDAL(pool),
          tag: new MssqlTagDAL(pool),
          documentType: new MssqlDocumentTypeDAL(pool),
          setting: new MssqlSettingDAL(pool),
          serviceType: new MssqlServiceTypeDAL(pool),
        };
      }

      case 'mysql': {
        const db = await getMysqlDB();
        return {
          country: new MysqlCountryDAL(db),
          state: new MysqlStateDAL(db),
          city: new MysqlCityDAL(db),
          category: new MysqlCategoryDAL(db),
          tag: new MysqlTagDAL(db),
          documentType: new MysqlDocumentTypeDAL(db),
          setting: new MysqlSettingDAL(db),
          serviceType: new MysqlServiceTypeDAL(db),
        };
      }

      case 'oracle': {
        const pool = await getOraclePool();
        return {
          country: new OracleCountryDAL(pool),
          state: new OracleStateDAL(pool),
          city: new OracleCityDAL(pool),
          category: new OracleCategoryDAL(pool),
          tag: new OracleTagDAL(pool),
          documentType: new OracleDocumentTypeDAL(pool),
          setting: new OracleSettingDAL(pool),
          serviceType: new OracleServiceTypeDAL(pool),
        };
      }

      case 'postgres':
      default: {
        const pool = await getPgPool();
        const db = pgDrizzle(pool);
        return {
          country: new PgCountryDAL(db),
          state: new PgStateDAL(db),
          city: new PgCityDAL(db),
          category: new PgCategoryDAL(db),
          tag: new PgTagDAL(db),
          documentType: new PgDocumentTypeDAL(db),
          setting: new PgSettingDAL(db),
          serviceType: new PgServiceTypeDAL(db),
        };
      }
    }
  }
}