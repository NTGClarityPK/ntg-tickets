/**
 * Backend exports for @ntg/shared-library
 * 
 * This file exports all backend guards, decorators, services, and utilities
 * that can be used in NestJS applications.
 */

// Import type declarations to extend Express Request
import './types/express';

// Guards
export { JwtAuthGuard } from './guards/jwt-auth.guard';
export { RolesGuard } from './guards/roles.guard';
export { CsrfGuard, CsrfService } from './guards/csrf.guard';
export { RateLimitGuard, RateLimit, RATE_LIMITS, type RateLimitOptions } from './guards/rate-limit.guard';

// Decorators
export { Roles, ROLES_KEY } from './decorators/roles.decorator';
export { CurrentUser } from './decorators/current-user.decorator';

// Validation
export { SanitizationService } from './validation/sanitization.service';

// Logger
export { LoggerService } from './logger/logger.service';
export { LoggerModule } from './logger/logger.module';

// Cache
export { CacheService } from './cache/cache.service';
export { CacheModule } from './cache/cache.module';
export { RedisService } from './cache/redis.service';
export { RedisModule } from './cache/redis.module';

// Middleware
export { LoggingMiddleware } from './middleware/logging.middleware';
export { SecurityHeadersMiddleware } from './middleware/security-headers.middleware';

