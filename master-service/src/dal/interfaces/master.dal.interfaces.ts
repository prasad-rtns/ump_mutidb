import { Country, State, City, Category, Tag, DocumentType, SystemSetting, ServiceType, CreateCountryDTO, CreateStateDTO, CreateCityDTO, CreateCategoryDTO, CreateTagDTO, CreateDocumentTypeDTO, UpsertSettingDTO, UpdateCountryDTO, UpdateCategoryDTO, CreateServiceTypeDTO, UpdateServiceTypeDTO } from '../../modules/coredata/coredata.types';

export interface ICountryDAL {
  findAll(activeOnly?: boolean): Promise<Country[]>;
  findById(id: string): Promise<Country | null>;
  findByCode(code: string): Promise<Country | null>;
  create(data: CreateCountryDTO): Promise<Country>;
  update(id: string, data: UpdateCountryDTO): Promise<Country | null>;
  delete(id: string): Promise<boolean>;
}

export interface IStateDAL {
  findAll(activeOnly?: boolean): Promise<State[]>;
  findByCountry(countryId: string, activeOnly?: boolean): Promise<State[]>;
  findById(id: string): Promise<State | null>;
  create(data: CreateStateDTO): Promise<State>;
  delete(id: string): Promise<boolean>;
}

export interface ICityDAL {
  findByState(stateId: string): Promise<City[]>;
  search(query: string, stateId?: string): Promise<City[]>;
  findById(id: string): Promise<City | null>;
  create(data: CreateCityDTO): Promise<City>;
  delete(id: string): Promise<boolean>;
}

export interface ICategoryDAL {
  findAll(activeOnly?: boolean, categoryType?: string): Promise<Category[]>;
  findById(id: string): Promise<Category | null>;
  findByCode(code: string): Promise<Category | null>;
  search(query: string, categoryType?: string): Promise<Category[]>;
  create(data: CreateCategoryDTO): Promise<Category>;
  update(id: string, data: UpdateCategoryDTO): Promise<Category | null>;
  delete(id: string): Promise<boolean>;
}

export interface ITagDAL {
  findAll(activeOnly?: boolean): Promise<Tag[]>;
  findById(id: string): Promise<Tag | null>;
  findBySlug(slug: string): Promise<Tag | null>;
  create(data: CreateTagDTO): Promise<Tag>;
  delete(id: string): Promise<boolean>;
}

export interface IDocumentTypeDAL {
  findAll(activeOnly?: boolean): Promise<DocumentType[]>;
  findById(id: string): Promise<DocumentType | null>;
  findByCode(code: string): Promise<DocumentType | null>;
  create(data: CreateDocumentTypeDTO): Promise<DocumentType>;
  delete(id: string): Promise<boolean>;
}

export interface IServiceTypeDAL {
  findAll(activeOnly?: boolean): Promise<ServiceType[]>;
  findById(id: string): Promise<ServiceType | null>;
  findByCode(code: string): Promise<ServiceType | null>;
  create(data: CreateServiceTypeDTO): Promise<ServiceType>;
  update(id: string, data: UpdateServiceTypeDTO): Promise<ServiceType | null>;
  delete(id: string): Promise<boolean>;
}

export interface ISettingDAL {
  findAll(): Promise<SystemSetting[]>;
  findPublic(): Promise<SystemSetting[]>;
  findByKey(key: string): Promise<SystemSetting | null>;
  upsert(data: UpsertSettingDTO): Promise<SystemSetting>;
  delete(key: string): Promise<boolean>;
}
