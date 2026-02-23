import jwt from 'jsonwebtoken';
import { JwtPayload, RefreshTokenPayload } from '../types';

export class JwtUtil {
  private static accessSecret = process.env.JWT_ACCESS_SECRET || 'access_secret_change_in_prod';
  private static refreshSecret = process.env.JWT_REFRESH_SECRET || 'refresh_secret_change_in_prod';
  private static accessExpiresIn = process.env.JWT_ACCESS_EXPIRES || '15m';
  private static refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES || '7d';

  static generateAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, this.accessSecret, {
      expiresIn: this.accessExpiresIn,
      issuer: 'ump-platform',
      audience: 'ump-client',
    } as jwt.SignOptions);
  }

  static generateRefreshToken(payload: Omit<RefreshTokenPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, this.refreshSecret, {
      expiresIn: this.refreshExpiresIn,
      issuer: 'ump-platform',
      audience: 'ump-client',
    } as jwt.SignOptions);
  }

  static verifyAccessToken(token: string): JwtPayload {
    return jwt.verify(token, this.accessSecret, {
      issuer: 'ump-platform',
      audience: 'ump-client',
    }) as JwtPayload;
  }

  static verifyRefreshToken(token: string): RefreshTokenPayload {
    return jwt.verify(token, this.refreshSecret, {
      issuer: 'ump-platform',
      audience: 'ump-client',
    }) as RefreshTokenPayload;
  }

  static decodeToken(token: string): JwtPayload | null {
    return jwt.decode(token) as JwtPayload | null;
  }

  static extractFromHeader(authHeader?: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    return authHeader.substring(7);
  }
}
