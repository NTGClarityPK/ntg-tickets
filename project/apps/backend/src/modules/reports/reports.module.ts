import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { PrismaService } from '../../database/prisma.service';
import { SystemMonitoringModule } from '../../common/system-monitoring/system-monitoring.module';

@Module({
  imports: [SystemMonitoringModule],
  providers: [ReportsService, PrismaService],
  controllers: [ReportsController],
  exports: [ReportsService],
})
export class ReportsModule {}
