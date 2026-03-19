import { IBaseDAL, PaginatedResult } from '@prasad-rtns/shared';
import { IUser, CreateUserDTO, UpdateUserDTO, UserFilter } from '../../modules/user/user.types';

/**
 * IUserDAL — contract every DB adapter must satisfy.
 * Services depend only on this interface, never on a concrete class.
 */
export interface IUserDAL extends IBaseDAL<IUser, CreateUserDTO, UpdateUserDTO> {
  // ─── Lookup helpers ──────────────────────────────────────────────────────────
  findByEmail(email: string): Promise<IUser | null>;
  findByUsername(username: string): Promise<IUser | null>;
  findByEmailOrUsername(identifier: string): Promise<IUser | null>;

  /** Returns user + joined role / department / designation */
  findByIdWithRelations(id: string): Promise<IUser | null>;

  // ─── Filtered list (role-scoped) ─────────────────────────────────────────────
  findFiltered(filter: UserFilter): Promise<PaginatedResult<IUser>>;

  // ─── Login-specific helpers ───────────────────────────────────────────────────
  incrementFailedLogins(id: string): Promise<number>;
  resetFailedLogins(id: string): Promise<void>;
  lockAccount(id: string, until: Date): Promise<void>;
  updateLastLogin(id: string, ip: string): Promise<void>;

  // ─── Status ───────────────────────────────────────────────────────────────────
  changeStatus(id: string, status: IUser['status'], updatedBy: string): Promise<boolean>;
  softDelete(id: string, deletedBy: string): Promise<boolean>;

  // ─── Aggregation ──────────────────────────────────────────────────────────────
  countByFilter(filter: Partial<UserFilter>): Promise<number>;
}
