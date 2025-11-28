import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';
import * as compression from 'compression';
import { AppConfigService } from './config/app-config.service';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    // Create NestJS application
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    const appConfig = app.get(AppConfigService);
    const port = appConfig.port;
    const apiPrefix = appConfig.apiPrefix;
    const corsOrigins = appConfig.corsOrigins;

    // Enable CORS globally for NestJS
    app.enableCors({
      origin: corsOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    });

    // Security middleware
    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
          },
        },
        crossOriginEmbedderPolicy: false,
      })
    );

    // Compression middleware
    app.use(compression());

    // Socket.IO will be handled by WebSocketGateway module

    // Global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      })
    );

    // Global prefix
    app.setGlobalPrefix(apiPrefix);

    // Swagger documentation
    const config = new DocumentBuilder()
      .setTitle('NTG Ticket API')
      .setDescription('Complete IT Support - Ticket Management System API')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('Auth', 'Authentication endpoints')
      .addTag('Users', 'User management endpoints')
      .addTag('Tickets', 'Ticket management endpoints')
      .addTag('Comments', 'Comment management endpoints')
      .addTag('Attachments', 'File attachment endpoints')
      .addTag('Notifications', 'Notification endpoints')
      .addTag('Reports', 'Reporting endpoints')
      .addTag('Admin', 'Administration endpoints')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });

    // Start the server
    await app.listen(port, () => {
      logger.log(`🚀 Application is running on: http://localhost:${port}`);
      logger.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
    });
  } catch (error) {
    logger.error('❌ Error starting the application:', error);
    process.exit(1);
  }
}

bootstrap();
