import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { SupabaseService } from '../../database/supabase.service';
import { SystemMonitoringModule } from '../../common/system-monitoring/system-monitoring.module';

@Module({
  imports: [SystemMonitoringModule],
  providers: [ReportsService],
  controllers: [ReportsController],
  exports: [ReportsService],
})
export class ReportsModule {}
