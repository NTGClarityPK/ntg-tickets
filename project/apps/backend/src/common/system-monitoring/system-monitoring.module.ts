import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { SystemMonitoringService } from './system-monitoring.service';

@Module({
  providers: [SystemMonitoringService],
  exports: [SystemMonitoringService],
})
export class SystemMonitoringModule {}
