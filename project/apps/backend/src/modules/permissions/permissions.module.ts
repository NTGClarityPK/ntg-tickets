import { Module } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { PermissionsController } from './permissions.controller';
import { PrismaService } from '../../database/prisma.service';

@Module({
  providers: [PermissionsService, PrismaService],
  controllers: [PermissionsController],
  exports: [PermissionsService],
})
export class PermissionsModule {}
