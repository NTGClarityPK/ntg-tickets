import { Module } from '@nestjs/common';
import { BackupService } from './backup.service';
import { BackupController } from './backup.controller';
import { PrismaService } from '../../database/prisma.service';
import { FileStorageModule } from '../../common/file-storage/file-storage.module';

@Module({
  imports: [FileStorageModule],
  providers: [BackupService, PrismaService],
  controllers: [BackupController],
  exports: [BackupService],
})
export class BackupModule {}
