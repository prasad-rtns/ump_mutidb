import { IBaseDAL, PaginatedResult } from '@prasad-rtns/shared';
import { User, CreateUserDTO, UpdateUserDTO, UserFilter } from '../../types';

/**
 * IUserDAL — contract every DB adapter must satisfy.
 * Services depend only on this interface, never on a concrete class.
 */
export interface IUserDAL extends IBaseDAL<User, CreateUserDTO, UpdateUserDTO> {
  // ─── Lookup helpers ──────────────────────────────────────────────────────────
  findByEmail(email: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  findByEmailOrUsername(identifier: string): Promise<User | null>;

  /** Returns user + joined role / department / designation */
  findByIdWithRelations(id: string): Promise<User | null>;

  // ─── Filtered list (role-scoped) ─────────────────────────────────────────────
  findFiltered(filter: UserFilter): Promise<PaginatedResult<User>>;

  // ─── Login-specific helpers ───────────────────────────────────────────────────
  incrementFailedLogins(id: string): Promise<number>;
  resetFailedLogins(id: string): Promise<void>;
  lockAccount(id: string, until: Date): Promise<void>;
  updateLastLogin(id: string, ip: string): Promise<void>;

  // ─── Status ───────────────────────────────────────────────────────────────────
  changeStatus(id: string, status: User['status'], updatedBy: string): Promise<boolean>;
  softDelete(id: string, deletedBy: string): Promise<boolean>;

  // ─── Aggregation ──────────────────────────────────────────────────────────────
  countByFilter(filter: Partial<UserFilter>): Promise<number>;
}
