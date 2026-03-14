import winston from 'winston';
import path from 'path';
import fs from 'fs';

const logLevel = process.env.LOG_LEVEL || 'info';
const logDir = process.env.LOG_DIR || './logs';
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: { service: process.env.SERVICE_NAME || 'auth-service' },
  format: winston.format.combine(
    winston.format.errors({ stack: true }),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({ all: true }),
        winston.format.timestamp({ format: 'HH:mm:ss.SSS' }),
        winston.format.printf(({ level, message, timestamp, service, ...meta }) => {
          const metaStr = Object.keys(meta).length
            ? ` ${JSON.stringify(meta)}`
            : '';
          return `${timestamp} [${service}] ${level}: ${message}${metaStr}`;
        })
      ),
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 10 * 1024 * 1024,
      maxFiles: 10,
    }),
  ],
});

const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }), // Include stack trace for errors
  winston.format.splat(), // Handles string interpolation
  winston.format.json() // Output as JSON for structured logging
);

/**
 * Creates a new Winston logger instance.
 * @param {string} name - The name of the logger (e.g., 'app', 'db', 'audit').
 * @param {string} fileName - The base filename for logs (e.g., 'combined.log', 'db.log').
 * @param {string} [level] - Optional log level for this specific logger. Defaults to global logLevel.
 * @returns {winston.Logger} A Winston logger instance.
 */
/* ──────────────────────────────────────────────────────────
   Custom Logger Factory (Per Service / Module)
────────────────────────────────────────────────────────── */
export const createLogger = (
  name: string,
  fileName?: string,
  level = logLevel
): winston.Logger => {

  const resolvedFileName =
    fileName || `${name}.log`;   // default to service-based name

  return winston.createLogger({
    level,
    format: fileFormat,
    defaultMeta: { service: name },
    transports: [
      new winston.transports.Console(),
      ...(process.env.ENABLE_FILE_LOGS === 'true'
        ? [
            new winston.transports.File({
              filename: path.join(logDir, resolvedFileName),
              maxsize: 10 * 1024 * 1024,
              maxFiles: 5,
            }),
          ]
        : []),
    ],
  });
};

export default logger;
//Example for custom log
//const logger = createLogger('auth-service', 'auth.log');