import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { SupabaseService } from './supabase.service';

@Global()
@Module({
  providers: [SupabaseService],
  exports: [PrismaService, SupabaseService],
})
export class DatabaseModule {}
