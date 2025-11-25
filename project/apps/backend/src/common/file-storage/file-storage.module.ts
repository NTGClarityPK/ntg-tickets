import { Global, Module } from '@nestjs/common';
import { FileStorageService } from './file-storage.service';
import { SupabaseModule } from '../supabase/supabase.module';

@Global()
@Module({
  imports: [SupabaseModule],
  providers: [FileStorageService],
  exports: [FileStorageService],
})
export class FileStorageModule {}
