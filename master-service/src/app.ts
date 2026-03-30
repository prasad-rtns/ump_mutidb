import 'express-async-errors';
import express from 'express';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import coredataRoutes from './modules/coredata/coredata.routes';
//import { swaggerSpec } from './docs/swagger.config';
import fs from 'fs';
import path from 'path';
import YAML from 'yaml';
import {
  applySecurityMiddleware,
  globalErrorHandler,
  notFoundHandler,
  DatabaseType
} from '@prasad-rtns/shared';
import { checkDbHealth } from './database/adapters/db.connection';
import { ResponseUtil } from '@prasad-rtns/shared';
import logger from './database/logger';
import { register, collectDefaultMetrics } from 'prom-client';
import {metricsMiddleware} from './middleware/metrics.middleware';
import {requestLogger} from './middleware/request.middleware';
import dotenv from 'dotenv';
dotenv.config();
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

// ─── Swagger UI ───────────────────────────────────────────────────────────────//
//const swaggerDocument = YAML.load('./src/docs/openapi.yaml');
const filePath = path.resolve(process.cwd(), 'src/docs/swagger.yaml');

if (!fs.existsSync(filePath)) {
  console.error('Swagger file not found:', filePath);
}

const file = fs.readFileSync(filePath, 'utf8');
const swaggerDocument = YAML.parse(file);

// logger.info('Loading swagger...');
// ─── Custom Logger Example (Uncomment if needed) ───────────────────────────────────────
// import { createLogger } from './database/logger';
// const customLogger = createLogger('auth-service', 'custom.log');
// customLogger.info('Loading custom log...');
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// ─── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/v1/master', coredataRoutes);

// ─── Metrics endpoint for Prometheus
app.use(metricsMiddleware);
app.use(requestLogger);
collectDefaultMetrics({ register });
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.get('/api/v1/master/getcall', async (_req, res) => {
 return ResponseUtil.success(res, {
    message: 'GET call successful',
    timestamp: new Date().toISOString(),
  });
});
// ─── Health Check ──────────────────────────────────────────────────────────────
app.get('/health', async (_req, res) => {
  const dbType = (process.env.DEFAULT_DB_TYPE || 'mysql') as DatabaseType;
  const dbHealth = await checkDbHealth(dbType);
  const allHealthy = Object.values(dbHealth).some(Boolean);
  return ResponseUtil.success(res, {
    status: allHealthy ? 'healthy' : 'degraded',
    service: process.env.SERVICE_NAME || 'auth-service',
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
