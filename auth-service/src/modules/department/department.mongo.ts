import { v4 as uuid } from 'uuid';
import { getMongoClient } from '../../database/adapters/db.connection';
import { IDepartmentRepository } from './department.interface';
import {
  IDepartment,
  CreateDepartmentDTO,
  UpdateDepartmentDTO,
} from './department.types';

interface MongoDepartmentDocument {
  _id: string;
  name: string;
  code: string;
  parentId?: string | null;
  managerId?: string | null;
  description?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class MongoDepartmentRepository
  implements IDepartmentRepository
{
  private async collection() {
    const { db } = await getMongoClient();
    return db.collection<MongoDepartmentDocument>('departments');
  }

  private map(doc: MongoDepartmentDocument): IDepartment {
    return {
      id: doc._id,
      name: doc.name,
      code: doc.code,
      parentId: doc.parentId ?? null,
      managerId: doc.managerId ?? null,
      description: doc.description ?? null,
      isActive: doc.isActive,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  async findAll(): Promise<IDepartment[]> {
    const col = await this.collection();
    const docs = await col.find().toArray();
    return docs.map((d) => this.map(d));
  }

  async findById(id: string): Promise<IDepartment | null> {
    const col = await this.collection();
    const doc = await col.findOne({ _id: id });
    return doc ? this.map(doc) : null;
  }

  async create(data: CreateDepartmentDTO): Promise<IDepartment> {
    const col = await this.collection();

    const now = new Date();

    const doc: MongoDepartmentDocument = {
      _id: uuid(),
      ...data,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    await col.insertOne(doc);

    return this.map(doc);
  }

  async update(
    id: string,
    data: UpdateDepartmentDTO
  ): Promise<IDepartment | null> {
    const col = await this.collection();

    await col.updateOne(
      { _id: id },
      { $set: { ...data, updatedAt: new Date() } }
    );

    const updated = await col.findOne({ _id: id });

    return updated ? this.map(updated) : null;
  }

  async delete(id: string): Promise<boolean> {
    const col = await this.collection();
    const result = await col.deleteOne({ _id: id });
    return result.deletedCount === 1;
  }
}