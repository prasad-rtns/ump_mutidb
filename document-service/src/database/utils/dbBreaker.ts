import CircuitBreaker from 'opossum';
import logger from '../logger';

export function createBreaker<T extends (...args: any[]) => Promise<any>>(fn: T) {

  const breaker = new CircuitBreaker(fn, {
    timeout: 5000,
    errorThresholdPercentage: 50,
    resetTimeout: 15000
  });

  breaker.on('open', () => logger.error('Circuit breaker OPEN'));
  breaker.on('halfOpen', () => logger.warn('Circuit breaker HALF-OPEN'));
  breaker.on('close', () => logger.info('Circuit breaker CLOSED'));

  return breaker;
}