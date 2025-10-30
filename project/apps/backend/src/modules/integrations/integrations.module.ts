import { Module } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { IntegrationsController } from './integrations.controller';
import { PrismaService } from '../../database/prisma.service';

@Module({
  providers: [IntegrationsService, PrismaService],
  controllers: [IntegrationsController],
  exports: [IntegrationsService],
})
export class IntegrationsModule {}
