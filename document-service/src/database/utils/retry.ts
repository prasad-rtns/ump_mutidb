import logger from '../logger';

export async function retry<T>(
  fn: () => Promise<T>,
  retries = 5,
  delay = 2000
): Promise<T> {

  for (let i = 1; i <= retries; i++) {
    try {
      return await fn();
    } catch (err) {
      logger.warn(`Retry ${i}/${retries} failed`);

      if (i === retries) throw err;

      await new Promise(res => setTimeout(res, delay));
    }
  }

  throw new Error('Retry failed');
}