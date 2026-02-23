import { createClient, RedisClientType } from 'redis';
import { createLogger } from './logger';

const logger = createLogger('redis-client');

export class RedisClient {
  private static instance: RedisClientType;
  private static isConnected = false;

  static async getInstance(): Promise<RedisClientType> {
    if (!this.instance) {
      this.instance = createClient({
        url: process.env.REDIS_URL || `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) return new Error('Max retries reached');
            return Math.min(retries * 100, 3000);
          },
        },
      }) as RedisClientType;

      this.instance.on('connect', () => {
        logger.info('Redis client connected');
        this.isConnected = true;
      });
      this.instance.on('error', (err) => {
        logger.error('Redis client error', { error: err.message });
        this.isConnected = false;
      });
      this.instance.on('reconnecting', () => {
        logger.warn('Redis client reconnecting...');
      });

      await this.instance.connect();
    }
    return this.instance;
  }

  static async disconnect(): Promise<void> {
    if (this.instance && this.isConnected) {
      await this.instance.quit();
      logger.info('Redis client disconnected');
    }
  }
}

export class CacheService {
  private redis!: RedisClientType;
  private prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  private async getClient(): Promise<RedisClientType> {
    if (!this.redis) {
      this.redis = await RedisClient.getInstance();
    }
    return this.redis;
  }

  private key(k: string): string {
    return `${this.prefix}:${k}`;
  }

  async get<T>(key: string): Promise<T | null> {
    const client = await this.getClient();
    const val = await client.get(this.key(key));
    if (!val) return null;
    try { return JSON.parse(val) as T; }
    catch { return val as unknown as T; }
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const client = await this.getClient();
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    if (ttlSeconds) {
      await client.setEx(this.key(key), ttlSeconds, serialized);
    } else {
      await client.set(this.key(key), serialized);
    }
  }

  async del(key: string): Promise<void> {
    const client = await this.getClient();
    await client.del(this.key(key));
  }

  async delPattern(pattern: string): Promise<void> {
    const client = await this.getClient();
    const keys = await client.keys(this.key(pattern));
    if (keys.length > 0) {
      await client.del(keys);
    }
  }

  async exists(key: string): Promise<boolean> {
    const client = await this.getClient();
    const count = await client.exists(this.key(key));
    return count > 0;
  }

  async incr(key: string, ttlSeconds?: number): Promise<number> {
    const client = await this.getClient();
    const val = await client.incr(this.key(key));
    if (ttlSeconds && val === 1) {
      await client.expire(this.key(key), ttlSeconds);
    }
    return val;
  }

  async hSet(hashKey: string, field: string, value: unknown): Promise<void> {
    const client = await this.getClient();
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    await client.hSet(this.key(hashKey), field, serialized);
  }

  async hGet<T>(hashKey: string, field: string): Promise<T | null> {
    const client = await this.getClient();
    const val = await client.hGet(this.key(hashKey), field);
    if (!val) return null;
    try { return JSON.parse(val) as T; }
    catch { return val as unknown as T; }
  }

  async hDel(hashKey: string, field: string): Promise<void> {
    const client = await this.getClient();
    await client.hDel(this.key(hashKey), field);
  }

  async hGetAll<T>(hashKey: string): Promise<Record<string, T>> {
    const client = await this.getClient();
    const data = await client.hGetAll(this.key(hashKey));
    const result: Record<string, T> = {};
    for (const [k, v] of Object.entries(data)) {
      try { result[k] = JSON.parse(v) as T; }
      catch { result[k] = v as unknown as T; }
    }
    return result;
  }

  async addToBlacklist(token: string, expiresInSecs: number): Promise<void> {
    await this.set(`blacklist:${token}`, '1', expiresInSecs);
  }

  async isBlacklisted(token: string): Promise<boolean> {
    return this.exists(`blacklist:${token}`);
  }
}
