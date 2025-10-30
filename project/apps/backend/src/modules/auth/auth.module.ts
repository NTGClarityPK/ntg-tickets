import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { SystemConfigService } from '../../common/config/system-config.service';
import { ValidationService } from '../../common/validation/validation.service';
import { SanitizationService } from '../../common/validation/sanitization.service';
import { TokenBlacklistService } from '../../common/security/token-blacklist.service';
import { RedisService } from '../../common/redis/redis.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { NextAuthJwtGuard } from './guards/nextauth-jwt.guard';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService, SystemConfigService],
      useFactory: (
        configService: ConfigService,
        systemConfigService: SystemConfigService
      ) => {
        const jwtSecret = configService.get('JWT_SECRET');

        if (!jwtSecret || jwtSecret.length < 32) {
          throw new Error(
            'JWT_SECRET must be set and at least 32 characters long'
          );
        }

        try {
          const sessionTimeout = systemConfigService.getSessionTimeout();
          const expiresIn = `${sessionTimeout}m`; // Convert minutes to JWT format

          return {
            secret: jwtSecret,
            signOptions: {
              expiresIn: expiresIn,
            },
          };
        } catch (error) {
          // Fallback to default if system config is not ready
          return {
            secret: jwtSecret,
            signOptions: {
              expiresIn: '30m', // Default 30 minutes
            },
          };
        }
      },
    }),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    NextAuthJwtGuard,
    ValidationService,
    SanitizationService,
    TokenBlacklistService,
    RedisService,
    AuditLogsService,
  ],
  controllers: [AuthController],
  exports: [
    AuthService,
    JwtStrategy,
    ValidationService,
    SanitizationService,
    TokenBlacklistService,
  ],
})
export class AuthModule {}
