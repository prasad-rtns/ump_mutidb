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
import swaggerJsdoc from 'swagger-jsdoc';
import router from './routes';
import { applySecurityMiddleware, globalErrorHandler, notFoundHandler } from '@prasad-rtns/shared';
import { ResponseUtil } from '@prasad-rtns/shared';
import logger from './controllers/logger';

const app = express();
applySecurityMiddleware(app);
app.use(cookieParser());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: (msg) => logger.http(msg.trim()) }, skip: (req) => req.path === '/health' }));

// Serve uploaded files (local provider)
app.use('/uploads', express.static(path.resolve(process.env.UPLOAD_DIR || './uploads')));

// Swagger
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: { title: 'UMP Document Service API', version: '1.0.0', description: 'Document upload & CDN management' },
    servers: [{ url: 'http://localhost:6003', description: 'Development' }],
    components: {
      securitySchemes: { BearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    },
    tags: [{ name: 'Documents' }, { name: 'Health' }],
  },
  apis: ['./src/routes/*.ts'],
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customSiteTitle: 'Document Service API Docs' }));
app.get('/api/docs.json', (_req, res) => res.json(swaggerSpec));
app.use('/api/documents', router);

app.get('/health', (_req, res) =>
  ResponseUtil.success(res, { status: 'healthy', service: 'document-service', uptime: process.uptime() })
);

app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
