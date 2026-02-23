import { Document, CreateDocumentDTO, DocumentFilter, UpdateDocumentStatusDTO } from '../../types';
import { PaginatedResult } from '@prasad-rtns/shared';

export interface IDocumentDAL {
  create(data: CreateDocumentDTO): Promise<Document>;
  createMany(data: CreateDocumentDTO[]): Promise<Document[]>;
  findById(id: string): Promise<Document | null>;
  findFiltered(filter: DocumentFilter): Promise<PaginatedResult<Document>>;
  updateStatus(id: string, data: UpdateDocumentStatusDTO): Promise<Document | null>;
  softDelete(id: string, deletedBy: string): Promise<boolean>;
  hardDelete(id: string): Promise<boolean>;
  exists(id: string): Promise<boolean>;
  countByUser(uploadedBy: string): Promise<number>;
}
