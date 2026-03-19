import { Request, Response, NextFunction } from 'express';
import logger from '../database/logger';

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;

    const logMeta = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    };

    if (res.statusCode >= 500) {
      logger.error('HTTP Request', logMeta);
    } else if (res.statusCode >= 400) {
      logger.warn('HTTP Request', logMeta);
    } else {
      logger.info('HTTP Request', logMeta);
    }
  });

  next();
};