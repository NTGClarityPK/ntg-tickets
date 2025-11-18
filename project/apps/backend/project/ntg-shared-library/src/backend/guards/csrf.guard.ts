import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { RedisService } from '../cache/redis.service';
import * as crypto from 'crypto';

/**
 * Generic CSRF Guard
 * Protects against Cross-Site Request Forgery attacks
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  private readonly logger = new Logger(CsrfGuard.name);

  constructor(private readonly redis: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    // Skip CSRF for GET requests and safe methods
    if (this.isSafeMethod(request.method)) {
      return true;
    }

    // Skip CSRF for API routes that don't need it
    if (this.isApiRoute(request.path)) {
      return true;
    }

    try {
      // Get CSRF token from header or body
      const token =
        (request.headers['x-csrf-token'] as string) ||
        request.body?._csrf ||
        (request.query?._csrf as string);

      if (!token) {
        throw new HttpException('CSRF token missing', HttpStatus.FORBIDDEN);
      }

      // Verify token
      const isValid = await this.verifyToken(token, request);

      if (!isValid) {
        throw new HttpException('Invalid CSRF token', HttpStatus.FORBIDDEN);
      }

      return true;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      // If Redis is down, allow the request but log the error
      this.logger.error('CSRF verification error:', error);
      return true;
    }
  }

  private isSafeMethod(method: string): boolean {
    return ['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase());
  }

  private isApiRoute(path: string): boolean {
    // Skip CSRF for certain API routes
    const skipPaths = [
      '/api/auth/login',
      '/api/auth/logout',
      '/api/health',
      '/api/metrics',
    ];

    return skipPaths.some(skipPath => path.startsWith(skipPath));
  }

  private async verifyToken(token: string, request: Request): Promise<boolean> {
    try {
      // Get session ID from request
      const sessionId = this.getSessionId(request);

      if (!sessionId) {
        return false;
      }

      // Get stored CSRF token from Redis
      const storedToken = await this.redis.get(`csrf:${sessionId}`);

      if (!storedToken) {
        return false;
      }

      // Compare tokens
      return crypto.timingSafeEqual(
        Buffer.from(token, 'hex'),
        Buffer.from(storedToken, 'hex')
      );
    } catch (error) {
      this.logger.error('CSRF token verification error:', error);
      return false;
    }
  }

  private getSessionId(request: Request): string | null {
    // Try to get session ID from various sources
    return (
      (request.headers['x-session-id'] as string) ||
      request.cookies?.sessionId ||
      null
    );
  }
}

/**
 * Service for generating and managing CSRF tokens
 */
@Injectable()
export class CsrfService {
  private readonly logger = new Logger(CsrfService.name);

  constructor(private readonly redis: RedisService) {}

  async generateToken(sessionId: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');

    // Store token in Redis with 1 hour expiration
    await this.redis.setex(`csrf:${sessionId}`, 3600, token);

    return token;
  }

  async validateToken(token: string, sessionId: string): Promise<boolean> {
    try {
      const storedToken = await this.redis.get(`csrf:${sessionId}`);

      if (!storedToken) {
        return false;
      }

      return crypto.timingSafeEqual(
        Buffer.from(token, 'hex'),
        Buffer.from(storedToken, 'hex')
      );
    } catch (error) {
      this.logger.error('CSRF token validation error:', error);
      return false;
    }
  }

  async revokeToken(sessionId: string): Promise<void> {
    await this.redis.del(`csrf:${sessionId}`);
  }

  async refreshToken(sessionId: string): Promise<string> {
    // Revoke old token
    await this.revokeToken(sessionId);

    // Generate new token
    return this.generateToken(sessionId);
  }
}

