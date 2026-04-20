import { Request, Response, NextFunction } from 'express';
import axios, { AxiosError } from 'axios';
import { JwtPayload, ResponseUtil } from '@prasad-rtns/shared';

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
    next();
  } catch (error) {
    const apiError = error as AxiosError<any>;
    const status = apiError.response?.status ?? 503;
    const message = apiError.response?.data?.message || apiError.message || 'Unable to validate user';
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
