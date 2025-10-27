import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Redis from 'redis';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis.RedisClientType;

  constructor(private configService: ConfigService) {
    this.client = Redis.createClient({
      url: `redis://${this.configService.get('REDIS_HOST', 'localhost')}:${this.configService.get('REDIS_PORT', 6379)}`,
      password: this.configService.get('REDIS_PASSWORD'),
    });

    this.client.on('error', err => {
      this.logger.error('Redis Client Error:', err);
    });

    this.client.connect();
  }

  async get(key: string): Promise<string | null> {
    try {
      const result = await this.client.get(key);
      return result as string | null;
    } catch (error) {
      this.logger.error('Error getting from Redis:', error);
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
      this.logger.error('Error setting in Redis:', error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      this.logger.error('Error deleting from Redis:', error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error('Error checking Redis existence:', error);
      return false;
    }
  }

  async flush(): Promise<void> {
    try {
      await this.client.flushAll();
    } catch (error) {
      this.logger.error('Error flushing Redis:', error);
    }
  }

  async setex(key: string, ttl: number, value: string): Promise<void> {
    try {
      await this.client.setEx(key, ttl, value);
    } catch (error) {
      this.logger.error('Error setting Redis with TTL:', error);
    }
  }

  async incr(key: string): Promise<number> {
    try {
      return await this.client.incr(key);
    } catch (error) {
      this.logger.error('Error incrementing Redis key:', error);
      return 0;
    }
  }

  async expire(key: string, ttl: number): Promise<void> {
    try {
      await this.client.expire(key, ttl);
    } catch (error) {
      this.logger.error('Error setting Redis expiration:', error);
    }
  }
}
