import { Module } from '@nestjs/common';
import { ValidationService } from '../../common/validation/validation.service';
import { SanitizationService } from '../../common/validation/sanitization.service';
import { TokenBlacklistService } from '../../common/security/token-blacklist.service';
import { RedisService } from '../../common/redis/redis.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { SupabaseModule } from '../../common/supabase/supabase.module';
import { AuthService } from './auth.service';
import { SupabaseAuthService } from './supabase-auth.service';
import { AuthController } from './auth.controller';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule,
    SupabaseModule,
  ],
  providers: [
    AuthService,
    SupabaseAuthService,
    SupabaseAuthGuard,
    ValidationService,
    SanitizationService,
    TokenBlacklistService,
    RedisService,
    AuditLogsService,
  ],
  controllers: [AuthController],
  exports: [
    AuthService,
    SupabaseAuthService,
    SupabaseAuthGuard,
    ValidationService,
    SanitizationService,
    TokenBlacklistService,
  ],
})
export class AuthModule {}
