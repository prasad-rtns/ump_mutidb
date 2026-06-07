import { Request, Response, NextFunction } from 'express';
import axios, { AxiosError } from 'axios';
import { JwtPayload, ResponseUtil } from '@prasad-rtns/shared';
import logger from '../database/logger';
import dotenv from 'dotenv';

dotenv.config();

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:6001/api/v1';

const mapUserPayload = (userData: any): JwtPayload => ({
  sub: userData.id,
  username: userData.username,
  email: userData.email,
  role: typeof userData.role === 'string' ? userData.role : userData.role?.slug ?? 'user',
  roleId: userData.roleId,
  departmentId: userData.departmentId,
  designationId: userData.designationId,
  sessionId: 'external',
});

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

const isElevatedRole = (role?: string) =>
  ['admin', 'super-admin', 'super_admin', 'super-user', 'super_user'].includes(role ?? '');

const hasAnyRequiredPermission = (permissions: string[], required: string[]) =>
  required.some((needed) => permissions.some((actual) => permissionMatches(actual, needed)));

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      ResponseUtil.unauthorized(res, 'Authentication token required');
      return;
    }

    const response = await axios.get(`${AUTH_SERVICE_URL}/auth/me`, {
      headers: { Authorization: authHeader },
      timeout: 5000,
    });

    const userData = response.data?.data;
    if (!userData) {
      ResponseUtil.unauthorized(res, 'User validation failed');
      return;
    }

    req.user = mapUserPayload(userData);
    (req as Request & { permissions?: string[] }).permissions = permissionList(userData.role?.permissions ?? userData.permissions);
    next();
  } catch (error) {
    const apiError = error as AxiosError<any>;
    const status = apiError.response?.status ?? 503;
    const message = apiError.response?.data?.message || apiError.message || 'Unable to validate user';
    logger.error(`Authentication failed: ${message}`);
    ResponseUtil.error(res, message, status);
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

export const requireAnyPermission = (...required: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      ResponseUtil.unauthorized(res);
      return;
    }

    if (isElevatedRole(req.user.role)) {
      next();
      return;
    }

    const permissions = (req as Request & { permissions?: string[] }).permissions ?? [];
    if (!hasAnyRequiredPermission(permissions, required)) {
      ResponseUtil.forbidden(res, `Access denied. Required permissions: ${required.join(', ')}`);
      return;
    }

    next();
  };
};

export const userAuthenticate = authenticate;
