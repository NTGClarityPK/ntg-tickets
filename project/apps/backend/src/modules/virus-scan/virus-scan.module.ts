import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { VirusScanService } from './virus-scan.service';

@Module({
  providers: [VirusScanService],
  exports: [VirusScanService],
})
export class VirusScanModule {}
