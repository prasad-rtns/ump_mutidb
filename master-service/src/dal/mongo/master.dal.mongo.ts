import { Db, Collection } from 'mongodb';
import { randomUUID } from 'crypto';

import type {
  ICountryDAL,
  IStateDAL,
  ICityDAL,
  ICategoryDAL,
  ITagDAL,
  IDocumentTypeDAL,
  ISettingDAL,
  IServiceTypeDAL
} from '../interfaces/master.dal.interfaces';

import type {
  Country,
  State,
  City,
  Category,
  Tag,
  DocumentType,
  SystemSetting,
  ServiceType,
  CreateCountryDTO,
  UpdateCountryDTO,
  CreateStateDTO,
  CreateCityDTO,
  CreateCategoryDTO,
  UpdateCategoryDTO,
  CreateTagDTO,
  CreateDocumentTypeDTO,
  UpsertSettingDTO,
  CreateServiceTypeDTO,
  UpdateServiceTypeDTO
} from '../../modules/coredata/coredata.types';

const now = () => new Date();
const nullableId = (value?: string | null) => value && value.trim() ? value : null;
const numericValue = (value: unknown, fallback = 0) => {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

/* ───────────────── Country ───────────────── */

export class MongoCountryDAL implements ICountryDAL {

  constructor(private db: Db) {}

  private col(): Collection<Country> {
    return this.db.collection<Country>('countries');
  }

  async findAll(activeOnly = true): Promise<Country[]> {
    return this.col()
      .find(activeOnly ? { isActive: true } : {})
      .toArray();
  }

  async findById(id: string): Promise<Country | null> {
    return this.col().findOne({ id });
  }

  async findByCode(code: string): Promise<Country | null> {
    return this.col().findOne({ code });
  }

  async create(data: CreateCountryDTO): Promise<Country> {
    const doc: Country = {
        id: randomUUID(),

        name: data.name,
        code: data.code,

        dialCode: data.dialCode ?? null,
        flag: data.flag ?? null,
        currency: data.currency ?? null,
        currencySymbol: data.currencySymbol ?? null,

        isActive: true,
        createdAt: now(),
        updatedAt: now(),
    };

    await this.col().insertOne(doc);
    return doc;
  }

  async update(id: string, data: UpdateCountryDTO): Promise<Country | null> {
    const result = await this.col().findOneAndUpdate(
        { id },
        {
        $set: {
            ...data,
            updatedAt: now(),
        }
        },
        { returnDocument: 'after' }
    );
    return result ?? null;
  }

  async delete(id: string): Promise<boolean> {
    const r = await this.col().updateOne(
      { id },
      { $set: { isActive: false, updatedAt: now() } }
    );
    return r.modifiedCount > 0;
  }
}

/* ───────────────── State ───────────────── */

export class MongoStateDAL implements IStateDAL {

  constructor(private db: Db) {}

  private col(): Collection<State> {
    return this.db.collection<State>('states');
  }

  async findAll(activeOnly = true): Promise<State[]> {
    return this.col()
      .find(activeOnly ? { isActive: true } : {})
      .toArray();
  }

  async findByCountry(countryId: string, activeOnly = true): Promise<State[]> {
    return this.col()
      .find({
        countryId,
        ...(activeOnly ? { isActive: true } : {})
      })
      .toArray();
  }

  async findById(id: string): Promise<State | null> {
    return this.col().findOne({ id });
  }

  async create(data: CreateStateDTO): Promise<State> {
    const doc: State = {
      id: randomUUID(),
      ...data,
      isActive: true,
      createdAt: now(),
      updatedAt: now(),
    };

    await this.col().insertOne(doc);
    return doc;
  }

  async delete(id: string): Promise<boolean> {
    const r = await this.col().updateOne(
      { id },
      { $set: { isActive: false, updatedAt: now() } }
    );
    return r.modifiedCount > 0;
  }
}

/* ───────────────── City ───────────────── */

export class MongoCityDAL implements ICityDAL {

  constructor(private db: Db) {}

  private col(): Collection<City> {
    return this.db.collection<City>('cities');
  }

  async findByState(stateId: string): Promise<City[]> {
    return this.col()
      .find({ stateId, isActive: true })
      .toArray();
  }

  async search(query: string, stateId?: string): Promise<City[]> {
    const filter: any = {
      name: { $regex: query, $options: 'i' }
    };

    if (stateId) filter.stateId = stateId;

    return this.col().find(filter).limit(100).toArray();
  }

  async findById(id: string): Promise<City | null> {
    return this.col().findOne({ id });
  }

  async create(data: CreateCityDTO): Promise<City> {
    const doc: City = {
        id: randomUUID(),

        name: data.name,
        stateId: data.stateId,

        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,

        isActive: true,
        createdAt: now(),
        updatedAt: now(),
    };

    await this.col().insertOne(doc);
    return doc;
  }

  async delete(id: string): Promise<boolean> {
    const r = await this.col().updateOne(
      { id },
      { $set: { isActive: false, updatedAt: now() } }
    );
    return r.modifiedCount > 0;
  }
}

/* ───────────────── Category ───────────────── */

export class MongoCategoryDAL implements ICategoryDAL {

  constructor(private db: Db) {}

  private col(): Collection<Category> {
    return this.db.collection<Category>('categories');
  }

  async findAll(activeOnly = true): Promise<Category[]> {
    return this.col()
      .find(activeOnly ? { isActive: true } : {})
      .toArray();
  }

  async findByParent(parentId: string | null): Promise<Category[]> {
    return this.col().find({ parentId }).toArray();
  }

  async findById(id: string): Promise<Category | null> {
    return this.col().findOne({ id });
  }

  async findByCode(code: string): Promise<Category | null> {
    return this.col().findOne({ code });
  }

  async search(query: string): Promise<Category[]> {
    return this.col()
      .find({ name: { $regex: query, $options: 'i' } })
      .toArray();
  }

  async create(data: CreateCategoryDTO): Promise<Category> {
    const doc: Category = {
        id: randomUUID(),

        name: data.name,
        code: data.code,

        parentId: nullableId(data.parentId),
        description: data.description ?? null,
        icon: data.icon ?? null,
        metadata: data.metadata ?? null,

        sortOrder: numericValue(data.sortOrder),

        isActive: true,
        createdAt: now(),
        updatedAt: now(),
    };

    await this.col().insertOne(doc);
    return doc;
  }

  async update(id: string, data: UpdateCategoryDTO): Promise<Category | null> {

    const updateData: Partial<Category> = {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.code !== undefined && { code: data.code }),
        ...(data.parentId !== undefined && { parentId: nullableId(data.parentId) }),
        ...(data.description !== undefined && { description: data.description ?? null }),
        ...(data.icon !== undefined && { icon: data.icon ?? null }),
        ...(data.metadata !== undefined && { metadata: data.metadata ?? null }),
        ...(data.sortOrder !== undefined && { sortOrder: numericValue(data.sortOrder) }),
        updatedAt: now(),
    };

    const result = await this.col().findOneAndUpdate(
        { id },
        { $set: updateData },
        { returnDocument: 'after' }
    );

    return result ?? null;   // ✅ no .value
    }

  async delete(id: string): Promise<boolean> {
    const r = await this.col().updateOne(
      { id },
      { $set: { isActive: false, updatedAt: now() } }
    );
    return r.modifiedCount > 0;
  }
}

/* ───────────────── Tag ───────────────── */

export class MongoTagDAL implements ITagDAL {

  constructor(private db: Db) {}

  private col(): Collection<Tag> {
    return this.db.collection<Tag>('tags');
  }

  async findAll(activeOnly = true): Promise<Tag[]> {
    return this.col()
      .find(activeOnly ? { isActive: true } : {})
      .toArray();
  }

  async findById(id: string): Promise<Tag | null> {
    return this.col().findOne({ id });
  }

  async findBySlug(slug: string): Promise<Tag | null> {
    return this.col().findOne({ slug });
  }

  async create(data: CreateTagDTO): Promise<Tag> {
    const slug = data.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    const doc: Tag = {
      id: randomUUID(),
      name: data.name,
      slug,
      color: data.color ?? null,
      isActive: true,
      createdAt: now(),
      updatedAt: now(),
    };

    await this.col().insertOne(doc);
    return doc;
  }

  async delete(id: string): Promise<boolean> {
    const r = await this.col().updateOne(
      { id },
      { $set: { isActive: false } }
    );
    return r.modifiedCount > 0;
  }
}

/* ───────────────── Document Type ───────────────── */

export class MongoDocumentTypeDAL implements IDocumentTypeDAL {

  constructor(private db: Db) {}

  private col(): Collection<DocumentType> {
    return this.db.collection<DocumentType>('document_types');
  }

  async findAll(activeOnly = true): Promise<DocumentType[]> {
    return this.col()
      .find(activeOnly ? { isActive: true } : {})
      .toArray();
  }

  async findById(id: string): Promise<DocumentType | null> {
    return this.col().findOne({ id });
  }

  async findByCode(code: string): Promise<DocumentType | null> {
    return this.col().findOne({ code });
  }

  async create(data: CreateDocumentTypeDTO): Promise<DocumentType> {
    const doc: DocumentType = {
        id: randomUUID(),

        name: data.name,
        code: data.code,

        description: data.description ?? null,

        allowedMimeTypes: data.allowedMimeTypes ?? [],
        maxSizeMb: data.maxSizeMb ?? 10,
        isRequired: data.isRequired ?? false,

        isActive: true,
        createdAt: now(),
        updatedAt: now(),
    };

    await this.col().insertOne(doc);
    return doc;
  }

  async delete(id: string): Promise<boolean> {
    const r = await this.col().updateOne(
      { id },
      { $set: { isActive: false } }
    );
    return r.modifiedCount > 0;
  }
}

/* ───────────────── Settings ───────────────── */

export class MongoSettingDAL implements ISettingDAL {

  constructor(private db: Db) {}

  private col(): Collection<SystemSetting> {
    return this.db.collection<SystemSetting>('system_settings');
  }

  async findAll(): Promise<SystemSetting[]> {
    return this.col().find().toArray();
  }

  async findPublic(): Promise<SystemSetting[]> {
    return this.col().find({ isPublic: true }).toArray();
  }

  async findByKey(key: string): Promise<SystemSetting | null> {
    return this.col().findOne({ key });
  }

  async upsert(data: UpsertSettingDTO): Promise<SystemSetting> {
    const updateData: Partial<SystemSetting> = {
        value: data.value,
        description: data.description ?? null,
        type: data.type ?? 'string',
        category: data.category ?? 'general',
        isPublic: data.isPublic ?? false,
        updatedAt: now(),
    };

    const result = await this.col().findOneAndUpdate(
        { key: data.key },
        {
        $set: updateData,
        $setOnInsert: {
            id: randomUUID(),
            key: data.key,
            createdAt: now(),
        }
        },
        {
        upsert: true,
        returnDocument: 'after'
        }
    );

    if (!result) {
        throw new Error('Upsert failed for system setting');
    }

    return result;
    }

  async delete(key: string): Promise<boolean> {
    const r = await this.col().deleteOne({ key });
    return r.deletedCount === 1;
  }
}

/* ───────────────── ServiceType ───────────────── */
export class MongoServiceTypeDAL implements IServiceTypeDAL {
  constructor(private db: Db) {}
  private col(): Collection<ServiceType> { return this.db.collection<ServiceType>('service_types'); }

  async findAll(activeOnly = true): Promise<ServiceType[]> {
    return this.col().find(activeOnly ? { isActive: true } : {}).toArray() as Promise<ServiceType[]>;
  }
  async findById(id: string): Promise<ServiceType | null> {
    return this.col().findOne({ id }) as Promise<ServiceType | null>;
  }
  async findByCode(code: string): Promise<ServiceType | null> {
    return this.col().findOne({ code }) as Promise<ServiceType | null>;
  }
  async create(data: CreateServiceTypeDTO): Promise<ServiceType> {
    const doc: ServiceType = { id: randomUUID(), name: data.name, code: data.code, description: data.description ?? null, routeLink: data.routeLink ?? null, icon: data.icon ?? null, isActive: true, createdAt: now(), updatedAt: now() };
    await this.col().insertOne(doc as any);
    return doc;
  }
  async update(id: string, data: UpdateServiceTypeDTO): Promise<ServiceType | null> {
    const r = await this.col().findOneAndUpdate({ id }, { $set: { ...data, updatedAt: now() } }, { returnDocument: 'after' });
    return r ?? null;
  }
  async delete(id: string): Promise<boolean> {
    const r = await this.col().updateOne({ id }, { $set: { isActive: false, updatedAt: now() } });
    return r.modifiedCount > 0;
  }
}
