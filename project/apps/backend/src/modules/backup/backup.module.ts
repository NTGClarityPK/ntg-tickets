import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { BackupService } from './backup.service';
import { BackupController } from './backup.controller';
import { SupabaseService } from '../../database/supabase.service';
import { FileStorageModule } from '../../common/file-storage/file-storage.module';

@Module({
  imports: [FileStorageModule],
  providers: [BackupService],
  controllers: [BackupController],
  exports: [BackupService],
})
export class BackupModule {}
