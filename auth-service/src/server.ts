import dotenv from 'dotenv';
dotenv.config();

import cors from 'cors';
import helmet from 'helmet';
import http from 'http';
import app from './app';
import { getMysqlPool, getMongoClient, getMssqlPool, getOraclePool, getPgPool, closeAllPools } from './database/adapters/db.connection';
import { DatabaseType, RedisClient } from '@prasad-rtns/shared';
import logger from './database/logger';

const PORT = parseInt(process.env.PORT || '6001');
const HOST = process.env.HOST || '0.0.0.0';
const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:8082')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

async function connectDatabase(dbType: DatabaseType) {
  switch (dbType) {
    case 'postgres':
      await getPgPool();
      break;
    case 'mysql':
      await getMysqlPool();
      break;
    case 'mssql':
      await getMssqlPool();
      break;
    case 'oracle':
      await getOraclePool();
      break;
    case 'mongodb':
      await getMongoClient();
      break;
  }
  logger.info('Database connected', { dbType });
}

async function startServer() {
  try {
    logger.info('Starting auth-service...');

    const dbType = (process.env.DEFAULT_DB_TYPE || 'mysql') as DatabaseType;
    await connectDatabase(dbType);
    logger.info(`Database connection established for ${dbType}`);
    
    await RedisClient.getInstance();
    logger.info('Redis connected');

    const server = http.createServer(app);

    server.listen(PORT, HOST, () => {
      logger.info(`Auth Service running at http://${HOST}:${PORT}`);
      logger.info(`Swagger docs: http://${HOST}:${PORT}/api/docs`);
      logger.info(`Health check: http://${HOST}:${PORT}/health`);
    });

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
