import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private client: Redis | null = null;
  private logger = new Logger('RedisService');
  private isConnected = false;

  constructor() {
    // Don't initialize Redis immediately - let it be lazy
    this.logger.log('Redis service initialized (lazy connection)');
  }

  private async ensureRedisConnection() {
    if (this.client && this.isConnected) {
      return;
    }

    try {
      const redisUrl = this.buildRedisUrl();
      this.client = new Redis(redisUrl);
      
      this.client.on('error', (err) => {
        this.logger.error('Redis error', err);
        this.isConnected = false;
      });
      
      this.client.on('connect', () => {
        this.logger.log('✅ Redis connected');
        this.isConnected = true;
      });

      // Test connection
      await this.client.ping();
    } catch (error) {
      this.logger.warn('⚠️ Redis connection failed (app will continue without it)', error);
      this.client = null;
      this.isConnected = false;
    }
  }

  private buildRedisUrl(): string {
    if (process.env.REDIS_URL) {
      return process.env.REDIS_URL;
    }

    const protocol = process.env.REDIS_TLS === 'true' ? 'rediss' : 'redis';
    const password = process.env.REDIS_PASSWORD ? `:${process.env.REDIS_PASSWORD}@` : '';
    const host = process.env.REDIS_HOST || 'localhost';
    const port = process.env.REDIS_PORT || 6379;

    return `${protocol}://${password}${host}:${port}`;
  }

  getClient(): Redis | null {
    return this.client;
  }

  async get(key: string): Promise<string | null> {
    await this.ensureRedisConnection();
    if (!this.client || !this.isConnected) {
      this.logger.warn('Redis not available, returning null for get');
      return null;
    }
    return this.client.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    await this.ensureRedisConnection();
    if (!this.client || !this.isConnected) {
      this.logger.warn('Redis not available, skipping set operation');
      return;
    }
    if (ttl) {
      await this.client.setex(key, ttl, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.ensureRedisConnection();
    if (!this.client || !this.isConnected) {
      this.logger.warn('Redis not available, skipping del operation');
      return;
    }
    await this.client.del(key);
  }

  async incr(key: string): Promise<number> {
    await this.ensureRedisConnection();
    if (!this.client || !this.isConnected) {
      this.logger.warn('Redis not available, returning 0 for incr');
      return 0;
    }
    return this.client.incr(key);
  }

  async expire(key: string, ttl: number): Promise<void> {
    await this.ensureRedisConnection();
    if (!this.client || !this.isConnected) {
      this.logger.warn('Redis not available, skipping expire operation');
      return;
    }
    await this.client.expire(key, ttl);
  }

  async quit(): Promise<void> {
    if (this.client) {
      await this.client.quit();
    }
  }
}
