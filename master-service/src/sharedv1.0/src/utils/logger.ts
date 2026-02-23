import winston from 'winston';
import path from 'path';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack, requestId, service, ...meta }) => {
  const reqId = requestId ? `[${requestId}]` : '';
  const svc = service ? `[${service}]` : '';
  const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
  const stackStr = stack ? `\n${stack}` : '';
  return `${timestamp} ${level.toUpperCase()} ${svc}${reqId} ${message} ${metaStr}${stackStr}`;
});

export const createLogger = (serviceName: string) => {
  const logDir = process.env.LOG_DIR || './logs';
  
  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    defaultMeta: { service: serviceName },
    format: combine(
      errors({ stack: true }),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
      json()
    ),
    transports: [
      new winston.transports.Console({
        format: combine(
          colorize({ all: true }),
          timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
          errors({ stack: true }),
          logFormat
        ),
      }),
      new winston.transports.File({
        filename: path.join(logDir, 'error.log'),
        level: 'error',
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
        tailable: true,
      }),
      new winston.transports.File({
        filename: path.join(logDir, 'combined.log'),
        maxsize: 10 * 1024 * 1024,
        maxFiles: 10,
        tailable: true,
      }),
    ],
    exceptionHandlers: [
      new winston.transports.File({
        filename: path.join(logDir, 'exceptions.log'),
      }),
    ],
    rejectionHandlers: [
      new winston.transports.File({
        filename: path.join(logDir, 'rejections.log'),
      }),
    ],
  });
};
