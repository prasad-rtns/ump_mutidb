import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export async function checkRedisHealth() {
  const start = Date.now();

  try {
    await redis.ping();
    return {
      status: 'UP',
      latency: Date.now() - start
    };
  } catch (error: any) {
    return {
      status: 'DOWN',
      error: error.message
    };
  }
}