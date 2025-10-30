import { Module } from '@nestjs/common';
import { SavedSearchesService } from './saved-searches.service';
import { SavedSearchesController } from './saved-searches.controller';
import { PrismaService } from '../../database/prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [SavedSearchesController],
  providers: [SavedSearchesService, PrismaService],
  exports: [SavedSearchesService],
})
export class SavedSearchesModule {}
