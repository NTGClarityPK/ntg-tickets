import { Module } from '@nestjs/common';
import { AttachmentsService } from './attachments.service';
import { AttachmentsController } from './attachments.controller';
import { PrismaService } from '../../database/prisma.service';
import { FileStorageModule } from '../../common/file-storage/file-storage.module';
import { VirusScanModule } from '../virus-scan/virus-scan.module';

@Module({
  imports: [FileStorageModule, VirusScanModule],
  providers: [AttachmentsService, PrismaService],
  controllers: [AttachmentsController],
  exports: [AttachmentsService],
})
export class AttachmentsModule {}
