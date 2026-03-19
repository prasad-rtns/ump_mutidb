import { Request, Response, NextFunction } from 'express';
import client from 'prom-client';

// Create a Registry (recommended for microservices)
const register = new client.Registry();

// Optional: collect default metrics (CPU, memory, event loop, etc.)
client.collectDefaultMetrics({ register });

// Counter → REQUIRED for RPS
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['service', 'method', 'route', 'status_code'],
});

// Histogram → Response time
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['service', 'method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 1, 2, 3, 5],
});

// Register metrics
register.registerMetric(httpRequestsTotal);
register.registerMetric(httpRequestDuration);

// Middleware
export const metricsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {

  const end = httpRequestDuration.startTimer();

  res.on('finish', () => {
    const routePath =
      (req.route && req.route.path) || req.path || 'unknown';

    const labels = {
      service: 'auth-service', // 🔥 Change per microservice
      method: req.method,
      route: routePath,
      status_code: String(res.statusCode), // must be string
    };

    httpRequestsTotal.inc(labels);  // Counter
    end(labels);                    // Histogram
  });

  next();
};

// Export registry for /metrics endpoint
export { register };