import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool }     from 'pg';
import { DatabaseType } from '@prasad-rtns/shared';
import { PgCountryDAL, PgStateDAL, PgCityDAL, PgCategoryDAL, PgTagDAL, PgDocumentTypeDAL, PgSettingDAL } from './pg/master.dal.pg';
import type { ICountryDAL, IStateDAL, ICityDAL, ICategoryDAL, ITagDAL, IDocumentTypeDAL, ISettingDAL } from './interfaces/master.dal.interfaces';

export interface MasterDALBundle {
  country:      ICountryDAL;
  state:        IStateDAL;
  city:         ICityDAL;
  category:     ICategoryDAL;
  tag:          ITagDAL;
  documentType: IDocumentTypeDAL;
  setting:      ISettingDAL;
}

let pgPool: Pool | null = null;

async function getPgDB() {
  if (!pgPool) {
    pgPool = new Pool({
      host:     process.env.POSTGRES_HOST || 'localhost',
      port:     parseInt(process.env.POSTGRES_PORT || '5432'),
      database: process.env.POSTGRES_DB   || 'ump_master',
      user:     process.env.POSTGRES_USER || 'ump_user',
      password: process.env.POSTGRES_PASSWORD || '',
      min: 2, max: 10,
    });
  }
  return drizzle(pgPool) as ReturnType<typeof drizzle>;
}

export class MasterDALFactory {
  static async get(_dbType: DatabaseType = 'postgres'): Promise<MasterDALBundle> {
    // All master data currently backed by PostgreSQL.
    // Swap out individual DALs for MySQL/Mongo as needed.
    const db = await getPgDB() as ConstructorParameters<typeof PgCountryDAL>[0];
    return {
      country:      new PgCountryDAL(db),
      state:        new PgStateDAL(db),
      city:         new PgCityDAL(db),
      category:     new PgCategoryDAL(db),
      tag:          new PgTagDAL(db),
      documentType: new PgDocumentTypeDAL(db),
      setting:      new PgSettingDAL(db),
    };
  }
}

export type { ICountryDAL, IStateDAL, ICityDAL, ICategoryDAL, ITagDAL, IDocumentTypeDAL, ISettingDAL };
