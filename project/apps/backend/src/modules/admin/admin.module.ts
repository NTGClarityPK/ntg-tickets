import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { PrismaService } from '../../database/prisma.service';
import { SystemConfigService } from '../../common/config/system-config.service';

@Module({
  providers: [AdminService, PrismaService, SystemConfigService],
  controllers: [AdminController],
  exports: [AdminService],
})
export class AdminModule {}
