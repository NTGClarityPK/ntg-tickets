import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AttachmentsService } from './attachments.service';
import { AttachmentsController } from './attachments.controller';
import { SupabaseService } from '../../database/supabase.service';
import { DatabaseModule } from '../../database/database.module';
import { FileStorageModule } from '../../common/file-storage/file-storage.module';
import { SupabaseStorageService } from '../../common/file-storage/supabase-storage.service';
import { VirusScanModule } from '../virus-scan/virus-scan.module';

@Module({
  imports: [DatabaseModule, FileStorageModule, VirusScanModule],
  providers: [
    AttachmentsService,
    PrismaService,
    SupabaseStorageService, // Add Supabase storage service
  ],
  controllers: [AttachmentsController],
  exports: [AttachmentsService],
})
export class AttachmentsModule {}
