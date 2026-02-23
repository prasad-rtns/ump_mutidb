import 'express-async-errors';
import express from 'express';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import router from './routes';
import { swaggerSpec } from './swagger/swagger.config';
import {
  applySecurityMiddleware,
  globalErrorHandler,
  notFoundHandler,
} from '@prasad-rtns/shared';
import { checkDbHealth } from './database/connection';
import { ResponseUtil } from '@prasad-rtns/shared';
import logger from './database/logger';

const app = express();

// ─── Core Middleware ───────────────────────────────────────────────────────────
applySecurityMiddleware(app);
app.use(cookieParser());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined', {
  stream: { write: (msg) => logger.http(msg.trim()) },
  skip: (req) => req.path === '/health',
}));

// ─── Swagger UI ───────────────────────────────────────────────────────────────
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Master Service API Docs',
  customCss: '.swagger-ui .topbar { background: #1a1a2e; }',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
  },
}));
app.get('/api/docs.json', (_req, res) => res.json(swaggerSpec));

// ─── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/master', router);

// ─── Health Check ──────────────────────────────────────────────────────────────
app.get('/health', async (_req, res) => {
  const dbHealth = await checkDbHealth();
  const allHealthy = Object.values(dbHealth).some(Boolean);
  return ResponseUtil.success(res, {
    status: allHealthy ? 'healthy' : 'degraded',
    service: process.env.SERVICE_NAME || 'master-service',
    version: '1.0.0',
    databases: dbHealth,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  }, allHealthy ? 'Service is healthy' : 'Service degraded', allHealthy ? 200 : 503);
});

// ─── 404 & Error Handlers ──────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
