import bcrypt from 'bcryptjs';
import { DALFactory, DALBundle }   from '../dal/dal.factory';
import { CacheService }             from '@prasad-rtns/shared';
import { DatabaseType }             from '@prasad-rtns/shared';
import { UserFilter, UpdateUserDTO, User, ChangePasswordInput, RegisterInput } from '../types';
import logger                       from '../database/logger';

const cache         = new CacheService('users');
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');

export class UserService {
  private dal!: DALBundle;
  private constructor(private readonly dbType: DatabaseType) {}

  static async create(dbType: DatabaseType): Promise<UserService> {
    const svc = new UserService(dbType);
    svc.dal   = await DALFactory.get(dbType);
    return svc;
  }

  async listUsers(filter: UserFilter) {
    const key    = `list:${JSON.stringify(filter)}`;
    const cached = await cache.get<{ data: unknown[]; total: number }>(key);
    if (cached) return cached;
    const result = await this.dal.user.findFiltered(filter);
    const safe   = { data: result.data.map(u => this._sanitize(u)), total: result.total };
    await cache.set(key, safe, 60);
    return safe;
  }

  async getById(id: string) {
    const key    = `detail:${id}`;
    const cached = await cache.get<unknown>(key);
    if (cached) return cached;
    const user = await this.dal.user.findByIdWithRelations(id);
    if (!user) return null;
    const safe = this._sanitize(user);
    await cache.set(key, safe, 300);
    return safe;
  }

  async createUser(input: RegisterInput, createdBy: string) {
    const { AuthService } = await import('./auth.service');
    const auth = await AuthService.create(this.dbType);
    return auth.register(input, createdBy);
  }

  async updateUser(id: string, data: UpdateUserDTO, updatedBy: string) {
    const existing = await this.dal.user.findById(id);
    if (!existing) throw new Error('User not found');
    const updated = await this.dal.user.update(id, { ...(data as any), updatedBy });
    if (!updated) throw new Error('Update failed');
    await this._invalidateCache(id);
    logger.info('User updated', { userId: id, updatedBy });
    return this._sanitize(updated);
  }

  async deleteUser(id: string, deletedBy: string) {
    const existing = await this.dal.user.findById(id);
    if (!existing) throw new Error('User not found');
    await this.dal.user.softDelete(id, deletedBy);
    await this._invalidateCache(id);
    logger.info('User soft-deleted', { userId: id, deletedBy });
    return { message: 'User deactivated successfully' };
  }

  async changeStatus(id: string, status: User['status'], updatedBy: string) {
    const existing = await this.dal.user.findById(id);
    if (!existing) throw new Error('User not found');
    await this.dal.user.changeStatus(id, status, updatedBy);
    await this._invalidateCache(id);
    logger.info(`User status → ${status}`, { userId: id, updatedBy });
    return { message: `User ${status} successfully` };
  }

  async changePassword(userId: string, input: ChangePasswordInput) {
    if (input.newPassword !== input.confirmPassword) throw new Error('Passwords do not match');
    const user = await this.dal.user.findById(userId);
    if (!user) throw new Error('User not found');
    const valid = await bcrypt.compare(input.currentPassword, user.password);
    if (!valid) throw new Error('Current password is incorrect');
    await this.dal.user.update(userId, { password: await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS) });
    logger.info('Password changed', { userId });
    return { message: 'Password changed successfully' };
  }

  async getDashboardStats(userId: string, role: string, departmentId: string) {
    const key    = `dashboard:${userId}:${role}`;
    const cached = await cache.get<unknown>(key);
    if (cached) return cached;
    const base: Partial<UserFilter> =
      role === 'admin' ? { departmentFilter: 'all' }
      : role === 'lead' ? { departmentFilter: departmentId }
      : { userFilter: userId };
    const [total, active, inactive] = await Promise.all([
      this.dal.user.countByFilter(base),
      this.dal.user.countByFilter({ ...base, status: 'active' }),
      this.dal.user.countByFilter({ ...base, status: 'inactive' }),
    ]);
    const stats = { totalUsers: total, activeUsers: active, inactiveUsers: inactive, suspendedUsers: total - active - inactive };
    await cache.set(key, stats, 300);
    return stats;
  }

  private async _invalidateCache(id: string) {
    await Promise.all([cache.del(`detail:${id}`), cache.delPattern('list:*'), cache.delPattern('dashboard:*')]);
  }

  private _sanitize(user: User) {
    const { password, emailVerificationToken, passwordResetToken, twoFactorSecret, ...rest } = user;
    void password; void emailVerificationToken; void passwordResetToken; void twoFactorSecret;
    return rest;
  }
}
