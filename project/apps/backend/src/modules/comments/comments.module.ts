import { Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  providers: [CommentsService, PrismaService],
  controllers: [CommentsController],
  exports: [CommentsService],
})
export class CommentsModule {}
