import { Module } from '@nestjs/common';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';
import { DatabaseModule } from '../../database/database.module';
import { SupabaseModule } from '../../common/supabase/supabase.module';
import { EmailModule } from '../../common/email/email.module';
import { ValidationService } from '../../common/validation/validation.service';

@Module({
  imports: [DatabaseModule, SupabaseModule, EmailModule],
  controllers: [TenantsController],
  providers: [TenantsService, ValidationService],
  exports: [TenantsService],
})
export class TenantsModule {}

