import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { RedisService } from '../redis/redis.service';

export interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  max: number; // Maximum number of requests
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);

  constructor(
    private readonly redis: RedisService,
    private readonly reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.get<RateLimitOptions>(
      'rateLimit',
      context.getHandler()
    );

    if (!options) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const key = this.generateKey(request, options);

    try {
      const current = await this.redis.get(key);
      const count = current ? parseInt(current, 10) : 0;

      if (count >= options.max) {
        throw new HttpException(
          options.message || 'Too many requests',
          HttpStatus.TOO_MANY_REQUESTS
        );
      }

      // Increment counter
      await this.redis.incr(key);

      // Set expiration if this is the first request
      if (count === 0) {
        await this.redis.expire(key, Math.ceil(options.windowMs / 1000));
      }

      return true;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      // If Redis is down, allow the request but log the error
      this.logger.error('Rate limiting error:', error);
      return true;
    }
  }

  private generateKey(request: Request, options: RateLimitOptions): string {
    if (options.keyGenerator) {
      return options.keyGenerator(request);
    }

    // Default key generation based on IP and user
    const ip = request.ip || request.connection.remoteAddress;
    const userId =
      (request as { user?: { id?: string } }).user?.id || 'anonymous';

    return `rate_limit:${ip}:${userId}`;
  }
}

// Decorator for rate limiting
export const RateLimit = (options: RateLimitOptions) => {
  return (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) => {
    Reflect.defineMetadata('rateLimit', options, descriptor.value);
    return descriptor;
  };
};

// Predefined rate limit configurations
export const RATE_LIMITS = {
  // General API rate limit
  API: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Too many API requests, please try again later',
  },

  // Authentication rate limit
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: 'Too many authentication attempts, please try again later',
  },

  // File upload rate limit
  UPLOAD: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    message: 'Too many file uploads, please try again later',
  },

  // Ticket creation rate limit
  TICKET_CREATE: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20,
    message: 'Too many ticket creation attempts, please try again later',
  },

  // Comment rate limit
  COMMENT: {
    windowMs: 60 * 1000, // 1 minute
    max: 10,
    message: 'Too many comments, please slow down',
  },

  // Search rate limit
  SEARCH: {
    windowMs: 60 * 1000, // 1 minute
    max: 30,
    message: 'Too many search requests, please slow down',
  },
} as const;
