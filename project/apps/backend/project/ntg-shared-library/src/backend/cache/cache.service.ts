import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Redis from 'redis';

/**
 * Generic cache service using Redis
 * Provides caching functionality with TTL support
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private client: Redis.RedisClientType;

  constructor(private configService: ConfigService) {
    this.client = Redis.createClient({
      url: `redis://${this.configService.get('REDIS_HOST', 'localhost')}:${this.configService.get('REDIS_PORT', 6379)}`,
      password: this.configService.get('REDIS_PASSWORD'),
    });

    this.client.on('error', (err: Error) => {
      this.logger.error('Redis Client Error:', err);
    });

    this.client.connect();
  }

  async get(key: string): Promise<string | null> {
    try {
      const result = await this.client.get(key);
      return result as string | null;
    } catch (error) {
      this.logger.error('Error getting cache:', error);
      return null;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    try {
      if (ttl) {
        await this.client.setEx(key, ttl, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      this.logger.error('Error setting cache:', error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      this.logger.error('Error deleting cache:', error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error('Error checking cache existence:', error);
      return false;
    }
  }

  async flush(): Promise<void> {
    try {
      await this.client.flushAll();
    } catch (error) {
      this.logger.error('Error flushing cache:', error);
    }
  }
}

