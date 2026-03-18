import { Request, Response, NextFunction } from 'express';
import { ResponseUtil } from '@prasad-rtns/shared';
import axios, { AxiosError } from 'axios';
import { JwtUtil, JwtPayload } from '@prasad-rtns/shared';
import logger from '../database/logger';
import dotenv from 'dotenv';
dotenv.config();

const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL || 'http://auth-service:6001/api/v1';

const getUserRoleSlug = (user: Request['user']): string | undefined => {
  const role = user?.role as string | { slug?: string } | undefined;

  if (typeof role === 'string') {
    return role;
  }

  return role?.slug;
};

export const userAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  //logger.info(`User authenticated : userAuthenticate middleware called for ${req.method} ${req.originalUrl}`);
  try {
    let token: string | undefined;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
      logger.info("--- verifyAccessToken ---:", JSON.stringify(token));   // 👈 DEBUG
      const decoded = JwtUtil.verifyAccessToken(token);
      logger.info("---0 Decoded token 0---:", decoded);   // 👈 DEBUG
      logger.info("-- JSON.stringify token --:", JSON.stringify(decoded));   // 👈 DEBUG
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
      });
      return;
    }

    // 🔹 Verify token locally first (fast fail)
    let payload: any;
    try {
      payload = JwtUtil.verifyAccessToken(token) as JwtPayload;
    } catch (err: any) {
      logger.error(`Token verification error: ${err.message}`);
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
      return;
    }
    // logger.info(`Token verified locally for user: ${JSON.stringify(payload)}`);
    // logger.info(`Validating user with auth service at ...${AUTH_SERVICE_URL}...`);
    // logger.info(`Token : ${token}`);
    // 🔹 Call Auth Service to validate user
    try {
      const response = await axios.get(
        `${AUTH_SERVICE_URL}/auth/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 5000,
        }
      );

      if (response.data?.data) {
        logger.info(`User authenticated from auth-service: ${JSON.stringify(response.data.data)}`);
        req.user = response.data.data;
        next();
        return;
      }

      res.status(401).json({
        success: false,
        message: 'User validation failed',
      });
    } catch (error) {
      const apiError = error as AxiosError<any>;

      if (apiError.response) {
        logger.error(
          `Auth service error: ${apiError.response.status} - ${apiError.response.data?.message}`
        );

        res.status(apiError.response.status).json({
          success: false,
          message:
            apiError.response.data?.message || 'User validation failed',
        });
        return;
      }

      if (apiError.code === 'ECONNABORTED') {
        logger.error('Auth service timeout');
        res.status(503).json({
          success: false,
          message: 'Auth service timeout',
        });
        return;
      }

      if (apiError.code === 'ECONNREFUSED') {
        logger.warn(
          'Auth service unavailable, using token payload fallback'
        );

        req.user = {
          ...payload,
        };

        next();
        return;
      }

      logger.error(`Auth service network error: ${apiError.message}`);
      res.status(503).json({
        success: false,
        message: 'Unable to validate user',
      });
    }
  } catch (error: any) {
    logger.error(`Auth middleware error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

export const authorizemaster = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      ResponseUtil.unauthorized(res);
      return;
    }
    const userRole = getUserRoleSlug(req.user);
    logger.info("req.user:", req?.user);
    logger.info("User role:", userRole ?? req?.user?.role);
    logger.info("Required userRole:", userRole);
    if (!userRole || !roles.includes(userRole)) {
      ResponseUtil.forbidden(res, `${JSON.stringify(userRole)} -- Access denied. Required roles: ${roles.join(', ')}`);
      return;
    }
    logger.info(`${JSON.stringify(userRole)} -- Required roles:`, roles);
    next();
  };
};
