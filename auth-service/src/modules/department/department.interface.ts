import { IDepartment, CreateDepartmentDTO, UpdateDepartmentDTO } from './department.types';

export interface IDepartmentRepository {
  findAll(): Promise<IDepartment[]>;
  findById(id: string): Promise<IDepartment | null>;
  create(data: CreateDepartmentDTO): Promise<IDepartment>;
  update(id: string, data: UpdateDepartmentDTO): Promise<IDepartment | null>;
  delete(id: string): Promise<boolean>;
}