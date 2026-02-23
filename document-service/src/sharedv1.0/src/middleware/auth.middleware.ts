import { Request, Response, NextFunction } from 'express';
import { JwtUtil } from '../utils/jwt';
import { CacheService } from '../utils/redis';
import { ResponseUtil } from '../utils/response';
import { UserRole } from '../types';

const tokenCache = new CacheService('auth');

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = JwtUtil.extractFromHeader(req.headers.authorization);
    if (!token) {
      ResponseUtil.unauthorized(res, 'Authentication token required');
      return;
    }

    // Check blacklist
    const isBlacklisted = await tokenCache.isBlacklisted(token);
    if (isBlacklisted) {
      ResponseUtil.unauthorized(res, 'Token has been revoked');
      return;
    }

    const payload = JwtUtil.verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (error: unknown) {
    const err = error as Error;
    if (err.name === 'TokenExpiredError') {
      ResponseUtil.unauthorized(res, 'Token has expired');
      return;
    }
    if (err.name === 'JsonWebTokenError') {
      ResponseUtil.unauthorized(res, 'Invalid token');
      return;
    }
    ResponseUtil.unauthorized(res, 'Authentication failed');
    return;
  }
};

export const authorize = (...roles: UserRole[]) => {
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

// Self or admin can access
export const selfOrAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    ResponseUtil.unauthorized(res);
    return;
  }
  const targetId = req.params.userId || req.params.id;
  if (req.user.role === 'admin' || req.user.sub === targetId) {
    return next();
  }
  return ResponseUtil.forbidden(res, 'You can only access your own resources');
};

// Department scope middleware
export const departmentScope = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    ResponseUtil.unauthorized(res);
    return;
  }
  if (req.user.role === 'admin') {
    // Admin sees all - no filter
    req.query.departmentFilter = 'all';
  } else if (req.user.role === 'lead') {
    // Lead sees own department
    req.query.departmentFilter = req.user.departmentId;
  } else {
    // User sees only self
    req.query.departmentFilter = 'self';
    req.query.userFilter = req.user.sub;
  }
  next();
};
