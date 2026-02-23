import { Request, Response, NextFunction, Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';
import { CacheService } from '../utils/redis';
import { ResponseUtil } from '../utils/response';
import { createLogger } from '../utils/logger';

const logger = createLogger('security');
const rateLimitCache = new CacheService('ratelimit');

// ─── Request ID middleware ─────────────────────────────────────────────────────
export const requestId = (req: Request, _res: Response, next: NextFunction) => {
  req.requestId = (req.headers['x-request-id'] as string) || uuidv4();
  next();
};

// ─── Helmet config ────────────────────────────────────────────────────────────
export const helmetConfig = () =>
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  });

// ─── CORS config ──────────────────────────────────────────────────────────────
export const corsConfig = () => {
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:6000').split(',');
  return cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: Origin ${origin} not allowed`));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-DB-Type'],
    exposedHeaders: ['X-Request-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
    credentials: true,
    maxAge: 86400,
  });
};

// ─── Rate limiter ─────────────────────────────────────────────────────────────
export const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
  skip: (req) => process.env.NODE_ENV === 'test',
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts, please try again later.' },
  keyGenerator: (req) => req.ip || 'unknown',
});

export const strictRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { success: false, message: 'Too many attempts, please try again in an hour.' },
});

// ─── DB Type Switcher middleware ──────────────────────────────────────────────
export const dbTypeSwitcher = (req: Request, _res: Response, next: NextFunction) => {
  const dbTypeHeader = req.headers['x-db-type'] as string;
  const validTypes = ['postgres', 'mysql', 'mssql', 'oracle', 'mongodb'];
  if (dbTypeHeader && validTypes.includes(dbTypeHeader.toLowerCase())) {
    req.dbType = dbTypeHeader.toLowerCase() as Request['dbType'];
  } else {
    req.dbType = (process.env.DEFAULT_DB_TYPE || 'postgres') as Request['dbType'];
  }
  next();
};

// ─── Error handler ────────────────────────────────────────────────────────────
export const globalErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    requestId: req.requestId,
  });

  if (res.headersSent) return;

  const statusCode = (err as unknown as { status?: number }).status || 500;
  ResponseUtil.error(res, 
    process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    statusCode
  );
};

// ─── Not found handler ────────────────────────────────────────────────────────
export const notFoundHandler = (req: Request, res: Response) => {
  ResponseUtil.notFound(res, `Route ${req.method} ${req.path} not found`);
};

// ─── Security headers ─────────────────────────────────────────────────────────
export const securityHeaders = (_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.removeHeader('X-Powered-By');
  next();
};

// ─── SQL Injection guard ──────────────────────────────────────────────────────
export const sqlInjectionGuard = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const sqlPattern = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|INTO|FROM|WHERE|OR|AND)\b.*--)|('.*')|(\b1=1\b)/i;
  const bodyStr = JSON.stringify(req.body);
  const queryStr = JSON.stringify(req.query);
  if (sqlPattern.test(bodyStr) || sqlPattern.test(queryStr)) {
    logger.warn('SQL injection attempt detected', {
      ip: req.ip,
      path: req.path,
      requestId: req.requestId,
    });
    ResponseUtil.error(res, 'Invalid input detected', 400);
    return;
  }
  next();
};

// ─── Apply all security middleware ───────────────────────────────────────────
export const applySecurityMiddleware = (app: Application) => {
  app.set('trust proxy', 1);
  app.use(requestId);
  app.use(helmetConfig());
  app.use(corsConfig());
  app.use(securityHeaders);
  app.use(globalRateLimit);
  app.use(dbTypeSwitcher);
  app.use(sqlInjectionGuard);
};
