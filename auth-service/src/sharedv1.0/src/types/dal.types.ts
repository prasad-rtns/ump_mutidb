// ─── Paginated result wrapper ──────────────────────────────────────────────────
export interface PaginatedResult<T> {
  data: T[];
  total: number;
}

// ─── Base filter/sort options ─────────────────────────────────────────────────
export interface FindOptions {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [key: string]: unknown;
}

// ─── Base DAL interface all entities implement ────────────────────────────────
export interface IBaseDAL<T, CreateDTO, UpdateDTO = Partial<CreateDTO>> {
  findById(id: string): Promise<T | null>;
  findAll(opts: FindOptions): Promise<PaginatedResult<T>>;
  create(data: CreateDTO): Promise<T>;
  update(id: string, data: UpdateDTO): Promise<T | null>;
  delete(id: string): Promise<boolean>;
}
