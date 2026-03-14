import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import app from './app';
//import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
//import { connectPostgres, connectMongo, disconnectAll } from './database/connection';
import { getPgPool, getMssqlPool, getOraclePool, getMongoClient, closeAllPools } from './database/adapters/db.connection';
import { RedisClient } from '@prasad-rtns/shared';
import logger from './database/logger';

const PORT = parseInt(process.env.PORT || '6003');
const HOST = process.env.HOST || '0.0.0.0';
//const app = express();
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);
app.use(
  cors({
    origin: [process.env.FRONTEND_URL || 'http://localhost:8082'],
    credentials: true,
  })
);

async function startServer() {
  try {
    logger.info('Starting document-service...');

    // Connect to databases
    await getPgPool();
    logger.info('✅ PostgreSQL connected');

    await getMongoClient();
    logger.info('✅ MongoDB connected');

    // Connect Redis
    await RedisClient.getInstance();
    logger.info('✅ Redis connected');

    const server = http.createServer(app);

    server.listen(PORT, HOST, () => {
      logger.info(`🚀 Document Service running at http://${HOST}:${PORT}`);
      logger.info(`📚 Swagger docs: http://${HOST}:${PORT}/api/docs`);
      logger.info(`🏥 Health check: http://${HOST}:${PORT}/health`);
    });

    // ─── Graceful shutdown ──────────────────────────────────────────────────────
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully...`);
      server.close(async () => {
        await closeAllPools();
        await RedisClient.disconnect();
        logger.info('Server closed');
        process.exit(0);
      });
      setTimeout(() => process.exit(1), 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception:', err);
      gracefulShutdown('uncaughtException');
    });
    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Rejection:', { reason });
      gracefulShutdown('unhandledRejection');
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();