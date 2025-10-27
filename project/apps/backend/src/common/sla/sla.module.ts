import { Module } from '@nestjs/common';
import { SLAService } from './sla.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [SLAService],
  exports: [SLAService],
})
export class SLAModule {}
