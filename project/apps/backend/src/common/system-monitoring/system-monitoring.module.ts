import { Module } from '@nestjs/common';
import { SystemMonitoringService } from './system-monitoring.service';

@Module({
  providers: [SystemMonitoringService],
  exports: [SystemMonitoringService],
})
export class SystemMonitoringModule {}
