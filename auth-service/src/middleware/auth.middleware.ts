import { Request, Response, NextFunction } from 'express';
import { CacheService, JwtPayload, JwtUtil, ResponseUtil } from '@prasad-rtns/shared';
import { DatabaseType } from '@prasad-rtns/shared';
import { AuthProviderService } from '../modules/auth/auth-provider.service';
import { DALFactory } from '../dal/dal.factory';

const tokenCache = new CacheService('auth');

const dbType = (req: Request): DatabaseType =>
  (req.dbType as DatabaseType) || (process.env.DEFAULT_DB_TYPE as DatabaseType) || 'postgres';

function localAuthFallbackEnabled() {
  return (process.env.ALLOW_LOCAL_AUTH_FALLBACK || 'false').toLowerCase() === 'true';
}

function isTrustedLocalRequest(req: Request) {
  const forwardedHost = req.headers['x-forwarded-host'];
  const host = Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost || req.headers.host;
  const sources = [req.headers.origin, req.headers.referer, host ? `http://${host}` : undefined]
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.toLowerCase());

  return sources.some((value) =>
    value.startsWith('http://localhost') ||
    value.startsWith('https://localhost') ||
    value.startsWith('http://127.0.0.1') ||
    value.startsWith('https://127.0.0.1') ||
    value.startsWith('http://auth-service') ||
    value.startsWith('https://auth-service'),
  );
}

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
    const useLocalAuth = authProvider === 'local' || (localAuthFallbackEnabled() && isTrustedLocalRequest(req));
    if (useLocalAuth) {
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

const normalizePermission = (value: string) => value.trim().toLowerCase().replace(/[\s_]+/g, '-');

const permissionList = (permissions: unknown): string[] => {
  if (Array.isArray(permissions)) return permissions.map(String).filter(Boolean);
  if (permissions && typeof permissions === 'object') {
    return Object.entries(permissions as Record<string, unknown>).flatMap(([resource, actions]) =>
      Array.isArray(actions) ? actions.map((action) => `${resource}:${String(action)}`) : [],
    );
  }
  return [];
};

const permissionMatches = (actual: string, required: string): boolean => {
  const [actualResource = '', actualAction = ''] = normalizePermission(actual).split(':');
  const [requiredResource = '', requiredAction = ''] = normalizePermission(required).split(':');

  if (!actualResource || !requiredResource) return false;
  if (actualResource === '*' || normalizePermission(actual) === '*') return true;
  if (actualResource !== requiredResource) return false;
  return actualAction === '*' || actualAction === requiredAction;
};

const isElevatedRole = (role?: string) => ['admin', 'super-admin', 'super_admin', 'super-user', 'super_user'].includes(role ?? '');

export const requireAnyPermission = (...required: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      ResponseUtil.unauthorized(res);
      return;
    }

    if (isElevatedRole(req.user.role)) {
      next();
      return;
    }

    const dal = await DALFactory.get(dbType(req));
    const user = await dal.user.findByIdWithRelations(req.user.sub);
    const permissions = permissionList(user?.role?.permissions);
    const allowed = required.some((needed) => permissions.some((actual) => permissionMatches(actual, needed)));

    if (!allowed) {
      ResponseUtil.forbidden(res, `Access denied. Required permissions: ${required.join(', ')}`);
      return;
    }

    next();
  };
};

export const selfOrAnyPermission = (...required: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      ResponseUtil.unauthorized(res);
      return;
    }

    const targetId = req.params.userId || req.params.id;
    if (req.user.sub === targetId || isElevatedRole(req.user.role)) {
      next();
      return;
    }

    const dal = await DALFactory.get(dbType(req));
    const user = await dal.user.findByIdWithRelations(req.user.sub);
    const permissions = permissionList(user?.role?.permissions);
    const allowed = required.some((needed) => permissions.some((actual) => permissionMatches(actual, needed)));

    if (!allowed) {
      ResponseUtil.forbidden(res, `Access denied. Required permissions: ${required.join(', ')}`);
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
