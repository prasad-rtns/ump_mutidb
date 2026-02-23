import logger from '../logger';

export async function logQueryPerformance<T>(
  label: string,
  fn: () => Promise<T>,
  slowThreshold = 300
): Promise<T> {

  const start = Date.now();

  try {
    const result = await fn();
    const duration = Date.now() - start;

    if (duration > slowThreshold) {
      logger.warn(`🐢 Slow Query (${duration}ms) → ${label}`);
    } else {
      logger.debug(`Query (${duration}ms) → ${label}`);
    }

    return result;

  } catch (err) {
    logger.error(`Query Failed → ${label}`);
    throw err;
  }
}