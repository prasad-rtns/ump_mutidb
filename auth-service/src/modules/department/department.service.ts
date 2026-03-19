import { DatabaseType } from '@prasad-rtns/shared';
import { createDepartmentRepository } from './department.repository';
import {
  CreateDepartmentDTO,
  UpdateDepartmentDTO,
} from './department.types';

export class DepartmentService {
  constructor(private dbType: DatabaseType) {}

  private repo() {
    return createDepartmentRepository(this.dbType);
  }

  async getAll() {
    return this.repo().findAll();
  }

  async getById(id: string) {
    return this.repo().findById(id);
  }

  async create(dto: CreateDepartmentDTO) {
    return this.repo().create(dto);
  }

  async update(id: string, dto: UpdateDepartmentDTO) {
    return this.repo().update(id, dto);
  }

  async delete(id: string) {
    return this.repo().delete(id);
  }
}