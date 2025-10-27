import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  constructor(private readonly logger: LoggerService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();

    // Log request
    this.logger.log(`Incoming Request: ${req.method} ${req.url}`, 'HTTP');

    // Override res.end to log response
    const originalEnd = res.end;
    res.end = function (chunk?: string | Buffer, encoding?: BufferEncoding) {
      const responseTime = Date.now() - start;

      // Log response
      this.logger.logRequest(req, res, responseTime);

      // Call original end
      originalEnd.call(this, chunk, encoding);
    }.bind(this);

    next();
  }
}
