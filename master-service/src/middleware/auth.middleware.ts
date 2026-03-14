import { Request, Response, NextFunction } from 'express';
import axios, { AxiosError } from 'axios';
import { JwtUtil, JwtPayload } from '@prasad-rtns/shared';
import logger from '../database/logger';
import dotenv from 'dotenv';
dotenv.config();

const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL || 'http://auth-service:6001/api/v1';

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

      if (response.data) {
        logger.info(`User authenticated from auth-service: ${JSON.stringify(response.data)}`);
        req.user = response.data; // depends on your response structure
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