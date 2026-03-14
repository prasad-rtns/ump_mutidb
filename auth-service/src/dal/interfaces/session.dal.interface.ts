import { ISession, CreateSessionDTO } from '../../modules/common/common.types';

export interface ISessionDAL {
  create(data: CreateSessionDTO): Promise<ISession>;
  findByRefreshToken(token: string): Promise<ISession | null>;
  findActiveByUserId(userId: string): Promise<ISession[]>;
  revokeByToken(token: string): Promise<void>;
  revokeAllByUserId(userId: string): Promise<void>;
  deleteExpired(): Promise<number>;
}
