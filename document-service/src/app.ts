// ─── app.ts ───────────────────────────────────────────────────────────────────
import 'express-async-errors';
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import router from './modules/document_upload/document.routes';
import {
  applySecurityMiddleware,
  globalErrorHandler,
  notFoundHandler,
  DatabaseType
} from '@rtns/core';
import { checkDbHealth } from './database/adapters/db.connection';
import { ResponseUtil } from '@rtns/core';
import logger from './database/logger';
import { register, collectDefaultMetrics } from 'prom-client';
import {metricsMiddleware} from './middleware/metrics.middleware';
import {requestLogger} from './middleware/request.middleware';
import fs from 'fs';
import YAML from 'yaml';

const app = express();
applySecurityMiddleware(app);
app.use(cookieParser());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: (msg) => logger.http(msg.trim()) }, skip: (req) => req.path === '/health' }));

// Serve uploaded files (local provider)
app.use('/uploads', express.static(path.resolve(process.env.UPLOAD_DIR || './uploads')));

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

app.use('/api/v1/documents', router);

// ─── Metrics endpoint for Prometheus
app.use(metricsMiddleware);
app.use(requestLogger);
collectDefaultMetrics({ register });
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
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
