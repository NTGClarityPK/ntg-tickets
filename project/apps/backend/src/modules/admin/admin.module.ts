import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { SupabaseService } from '../../database/supabase.service';
import { SystemConfigService } from '../../common/config/system-config.service';

@Module({
  providers: [AdminService, PrismaService, SystemConfigService],
  controllers: [AdminController],
  exports: [AdminService],
})
export class AdminModule {}
