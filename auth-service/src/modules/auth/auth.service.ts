import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { DALFactory, DALBundle }    from '../../dal/dal.factory';
import { JwtUtil }                   from '@prasad-rtns/shared';
import { CacheService }              from '@prasad-rtns/shared';
import { DatabaseType, JwtPayload }  from '@prasad-rtns/shared';
import { LoginInput, RegisterInput, LoginResult } from './auth.types';
import { IUser } from '../user/user.types';
import logger                        from '../../database/logger';

const cache = new CacheService('auth');
const BCRYPT_ROUNDS   = parseInt(process.env.BCRYPT_ROUNDS        || '12');
const MAX_ATTEMPTS    = parseInt(process.env.MAX_LOGIN_ATTEMPTS    || '5');
const LOCK_DURATION   = parseInt(process.env.LOCK_DURATION_MINUTES || '30') * 60_000;

export class AuthService {
  private dal!: DALBundle;
  private constructor(private readonly dbType: DatabaseType) {}

  static async create(dbType: DatabaseType): Promise<AuthService> {
    const svc = new AuthService(dbType);
    svc.dal = await DALFactory.get(dbType);
    return svc;
  }

  async register(input: RegisterInput, createdBy?: string) {
    const [byEmail, byUsername] = await Promise.all([
      this.dal.user.findByEmail(input.email),
      this.dal.user.findByUsername(input.username),
    ]);
    if (byEmail)    throw new Error('Email already registered');
    if (byUsername) throw new Error('Username already taken');

    const hashed = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    const emailVerificationToken = uuidv4();
    const user = await this.dal.user.create({ ...input, email: input.email.toLowerCase(), password: hashed, createdBy });
    await cache.set(`email_verify:${emailVerificationToken}`, user.id, 86_400);
    logger.info('User registered', { userId: user.id });
    return this._sanitize(user);
  }

  async login(input: LoginInput, ip: string, userAgent: string): Promise<LoginResult> {
    const user = await this.dal.user.findByEmailOrUsername(input.identifier);
    if (!user) throw new Error('Invalid credentials');

    if (user.lockUntil && user.lockUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60_000);
      throw new Error(`Account locked. Try again in ${minutesLeft} minutes`);
    }

    const valid = await bcrypt.compare(input.password, user.password);
    if (!valid) {
      const attempts = await this.dal.user.incrementFailedLogins(user.id);
      if (attempts >= MAX_ATTEMPTS) {
        await this.dal.user.lockAccount(user.id, new Date(Date.now() + LOCK_DURATION));
        throw new Error(`Account locked for ${process.env.LOCK_DURATION_MINUTES ?? 30} minutes`);
      }
      throw new Error(`Invalid credentials. ${MAX_ATTEMPTS - attempts} attempts remaining`);
    }

    if (user.status !== 'active') throw new Error(`Account is ${user.status}. Contact admin.`);

    await Promise.all([this.dal.user.resetFailedLogins(user.id), this.dal.user.updateLastLogin(user.id, ip)]);

    const full = await this.dal.user.findByIdWithRelations(user.id);
    if (!full) throw new Error('User lookup failed');

    const sessionId = uuidv4();
    const tokenPayload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: full.id, username: full.username, email: full.email,
      role: (full.role?.slug ?? 'user') as JwtPayload['role'],
      roleId: full.roleId, departmentId: full.departmentId,
      designationId: full.designationId, sessionId,
    };

    const accessToken  = JwtUtil.generateAccessToken(tokenPayload);
    const refreshToken = JwtUtil.generateRefreshToken({ sub: full.id, sessionId, type: 'refresh' });

    await this.dal.session.create({
      userId: full.id, refreshToken,
      deviceInfo: input.deviceInfo ?? userAgent, ipAddress: ip, userAgent,
      expiresAt: new Date(Date.now() + 7 * 86_400_000),
    });

    await cache.set(`user:${full.id}`, this._sanitize(full), 900);
    logger.info('User logged in', { userId: full.id });
    return { user: this._sanitize(full), accessToken, refreshToken, expiresIn: process.env.JWT_ACCESS_EXPIRES ?? '15m' };
  }

  async refreshToken(token: string) {
    const payload = JwtUtil.verifyRefreshToken(token);
    const session = await this.dal.session.findByRefreshToken(token);
    if (!session || session.isRevoked) throw new Error('Invalid or revoked refresh token');
    if (session.expiresAt < new Date())  throw new Error('Refresh token expired');

    const user = await this.dal.user.findByIdWithRelations(payload.sub);
    if (!user || user.status !== 'active') throw new Error('User not found or inactive');

    await this.dal.session.revokeByToken(token);
    const newSid = uuidv4();
    const newAccess  = JwtUtil.generateAccessToken({ sub: user.id, username: user.username, email: user.email, role: (user.role?.slug ?? 'user') as JwtPayload['role'], roleId: user.roleId, departmentId: user.departmentId, designationId: user.designationId, sessionId: newSid });
    const newRefresh = JwtUtil.generateRefreshToken({ sub: user.id, sessionId: newSid, type: 'refresh' });
    await this.dal.session.create({ userId: user.id, refreshToken: newRefresh, deviceInfo: session.deviceInfo ?? undefined, ipAddress: session.ipAddress ?? undefined, userAgent: session.userAgent ?? undefined, expiresAt: new Date(Date.now() + 7 * 86_400_000) });
    return { accessToken: newAccess, refreshToken: newRefresh, expiresIn: process.env.JWT_ACCESS_EXPIRES ?? '15m' };
  }

  async logout(userId: string, accessToken: string, refreshToken?: string): Promise<void> {
    const decoded = JwtUtil.decodeToken(accessToken);
    if (decoded?.exp) { const ttl = decoded.exp - Math.floor(Date.now() / 1000); if (ttl > 0) await cache.addToBlacklist(accessToken, ttl); }
    if (refreshToken) await this.dal.session.revokeByToken(refreshToken);
    await cache.del(`user:${userId}`);
    logger.info('User logged out', { userId });
  }

  async logoutAll(userId: string, accessToken: string): Promise<void> {
    await this.dal.session.revokeAllByUserId(userId);
    const decoded = JwtUtil.decodeToken(accessToken);
    if (decoded?.exp) { const ttl = decoded.exp - Math.floor(Date.now() / 1000); if (ttl > 0) await cache.addToBlacklist(accessToken, ttl); }
    await cache.del(`user:${userId}`);
  }

  _sanitize(user: IUser) {
    const { password, emailVerificationToken, passwordResetToken, twoFactorSecret, ...rest } = user;
    void password; void emailVerificationToken; void passwordResetToken; void twoFactorSecret;
    return rest;
  }
}
