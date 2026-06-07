import {
  CreateCompanyOrUtilityDTO,
  CreateModuleMenuDTO,
  ICompanyOrUtility,
  IModuleMenu,
  UpdateCompanyOrUtilityDTO,
  UpdateModuleMenuDTO,
} from '../../modules/master/master.types';

export interface ICompanyOrUtilityDAL {
  findAll(activeOnly?: boolean): Promise<ICompanyOrUtility[]>;
  findById(id: string): Promise<ICompanyOrUtility | null>;
  findByCode(code: string): Promise<ICompanyOrUtility | null>;
  create(data: CreateCompanyOrUtilityDTO): Promise<ICompanyOrUtility>;
  update(id: string, data: UpdateCompanyOrUtilityDTO): Promise<ICompanyOrUtility | null>;
  delete(id: string): Promise<boolean>;
}

export interface IModuleMenuDAL {
  findAll(activeOnly?: boolean): Promise<IModuleMenu[]>;
  findById(id: string): Promise<IModuleMenu | null>;
  findByCode(code: string): Promise<IModuleMenu | null>;
  create(data: CreateModuleMenuDTO): Promise<IModuleMenu>;
  update(id: string, data: UpdateModuleMenuDTO): Promise<IModuleMenu | null>;
  delete(id: string): Promise<boolean>;
}
