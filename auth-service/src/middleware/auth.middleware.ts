import { Request, Response, NextFunction } from 'express';
import { CacheService, JwtPayload, JwtUtil, ResponseUtil } from '@prasad-rtns/shared';
import { DatabaseType } from '@prasad-rtns/shared';
import { AuthProviderService } from '../modules/auth/auth-provider.service';

const tokenCache = new CacheService('auth');

const dbType = (req: Request): DatabaseType =>
  (req.dbType as DatabaseType) || (process.env.DEFAULT_DB_TYPE as DatabaseType) || 'postgres';

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token = JwtUtil.extractFromHeader(req.headers.authorization);
    if (!token) {
      ResponseUtil.unauthorized(res, 'Authentication token required');
      return;
    }

    const authProvider = AuthProviderService.getProvider();
    if (authProvider === 'local') {
      const isBlacklisted = await tokenCache.isBlacklisted(token);
      if (isBlacklisted) {
        ResponseUtil.unauthorized(res, 'Token has been revoked');
        return;
      }

      const payload = JwtUtil.verifyAccessToken(token);
      req.user = payload;
      next();
      return;
    }

    const svc = await AuthProviderService.create(dbType(req));
    const user = await svc.resolveAuthenticatedUser(token);
    req.user = AuthProviderService.toJwtPayload(user);
    next();
  } catch (error: unknown) {
    const err = error as Error;
    if (err.name === 'TokenExpiredError') {
      ResponseUtil.unauthorized(res, 'Token has expired');
      return;
    }
    if (err.name === 'JsonWebTokenError' || err.name === 'JWTExpired' || err.name === 'JWSSignatureVerificationFailed') {
      ResponseUtil.unauthorized(res, 'Invalid token');
      return;
    }
    ResponseUtil.unauthorized(res, err.message || 'Authentication failed');
  }
};

export const authorize = (...roles: JwtPayload['role'][]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      ResponseUtil.unauthorized(res);
      return;
    }
    if (!roles.includes(req.user.role)) {
      ResponseUtil.forbidden(res, `Access denied. Required roles: ${roles.join(', ')}`);
      return;
    }
    next();
  };
};

export const selfOrAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    ResponseUtil.unauthorized(res);
    return;
  }

  const targetId = req.params.userId || req.params.id;
  if (req.user.role === 'admin' || req.user.sub === targetId) {
    next();
    return;
  }

  ResponseUtil.forbidden(res, 'You can only access your own resources');
};

export const departmentScope = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (!req.user) {
    ResponseUtil.unauthorized(res);
    return;
  }

  if (req.user.role === 'admin') {
    req.query.departmentFilter = 'all';
  } else if (req.user.role === 'lead') {
    req.query.departmentFilter = req.user.departmentId;
  } else {
    req.query.departmentFilter = 'self';
    req.query.userFilter = req.user.sub;
  }

  next();
};
