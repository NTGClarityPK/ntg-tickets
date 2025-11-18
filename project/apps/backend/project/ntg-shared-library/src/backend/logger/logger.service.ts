import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { ConfigService } from '@nestjs/config';

/**
 * Generic logger service using Winston
 * Provides structured logging with file rotation
 */
@Injectable()
export class LoggerService implements NestLoggerService {
  private readonly logger: winston.Logger;

  constructor(private configService: ConfigService) {
    const logLevel = this.configService.get('LOG_LEVEL', 'info');
    const logDir = this.configService.get('LOG_DIR', 'logs');

    // Create log format
    const logFormat = winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss',
      }),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.prettyPrint()
    );

    // Create console format for development
    const consoleFormat = winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss',
      }),
      winston.format.printf(
        ({ timestamp, level, message, context, trace, ...meta }) => {
          let log = `${timestamp} [${context || 'Application'}] ${level}: ${message}`;

          if (Object.keys(meta).length > 0) {
            log += `\n${JSON.stringify(meta, null, 2)}`;
          }

          if (trace) {
            log += `\n${trace}`;
          }

          return log;
        }
      )
    );

    // Create transports
    const transports: winston.transport[] = [];

    // Console transport for development
    if (this.configService.get('NODE_ENV') !== 'production') {
      transports.push(
        new winston.transports.Console({
          format: consoleFormat,
        })
      );
    }

    // File transports for production
    transports.push(
      new DailyRotateFile({
        filename: `${logDir}/application-%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
        format: logFormat,
      }),
      new DailyRotateFile({
        filename: `${logDir}/error-%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        level: 'error',
        maxSize: '20m',
        maxFiles: '30d',
        format: logFormat,
      }),
      new DailyRotateFile({
        filename: `${logDir}/access-%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '7d',
        format: logFormat,
      })
    );

    this.logger = winston.createLogger({
      level: logLevel,
      format: logFormat,
      transports,
      exitOnError: false,
    });
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { context, trace });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }

  // Custom logging methods
  logRequest(
    req: {
      method: string;
      url: string;
      get: (header: string) => string;
      ip: string;
      user?: { id: string };
    },
    res: { statusCode: number },
    responseTime: number
  ) {
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.id,
    };

    this.logger.info('HTTP Request', { context: 'HTTP', ...logData });
  }

  logError(
    error: Error,
    context?: string,
    additionalData?: Record<string, unknown>
  ) {
    this.logger.error(error.message, {
      context: context || 'Error',
      stack: error.stack,
      ...additionalData,
    });
  }

  logSecurity(event: string, data: Record<string, unknown>) {
    this.logger.warn(`Security Event: ${event}`, {
      context: 'Security',
      ...data,
    });
  }

  logAudit(
    action: string,
    userId: string,
    resource: string,
    details?: Record<string, unknown>
  ) {
    this.logger.info(`Audit: ${action}`, {
      context: 'Audit',
      userId,
      resource,
      ...details,
    });
  }

  logPerformance(
    operation: string,
    duration: number,
    details?: Record<string, unknown>
  ) {
    this.logger.info(`Performance: ${operation}`, {
      context: 'Performance',
      duration: `${duration}ms`,
      ...details,
    });
  }
}

