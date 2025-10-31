import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { PermissionsService } from './permissions.service';
import { PermissionsController } from './permissions.controller';
import { SupabaseService } from '../../database/supabase.service';

@Module({
  providers: [PermissionsService],
  controllers: [PermissionsController],
  exports: [PermissionsService],
})
export class PermissionsModule {}
