import { Session, CreateSessionDTO } from '../../types';

export interface ISessionDAL {
  create(data: CreateSessionDTO): Promise<Session>;
  findByRefreshToken(token: string): Promise<Session | null>;
  findActiveByUserId(userId: string): Promise<Session[]>;
  revokeByToken(token: string): Promise<void>;
  revokeAllByUserId(userId: string): Promise<void>;
  deleteExpired(): Promise<number>;
}
