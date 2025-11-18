import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggerService } from '../logger/logger.service';

/**
 * Generic logging middleware
 * Logs all HTTP requests with response times
 */
@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  constructor(private readonly logger: LoggerService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    const logger = this.logger;

    // Log request
    this.logger.log(`Incoming Request: ${req.method} ${req.url}`, 'HTTP');

    // Override res.end to log response
    const originalEnd = res.end.bind(res);
    (res as any).end = function (chunk?: any, encoding?: any, cb?: any) {
      const responseTime = Date.now() - start;

      // Log response with proper typing
      logger.logRequest(
        {
          method: req.method,
          url: req.url,
          get: (header: string) => req.get(header) || '',
          ip: req.ip || req.connection.remoteAddress || '',
          user: (req as any).user,
        },
        res,
        responseTime
      );

      // Call original end
      if (cb) {
        originalEnd(chunk, encoding, cb);
      } else if (encoding) {
        originalEnd(chunk, encoding);
      } else if (chunk) {
        originalEnd(chunk);
      } else {
        originalEnd();
      }
    };

    next();
  }
}

