import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { PrismaService } from '../../database/prisma.service';
import { EmailModule } from '../../common/email/email.module';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [EmailModule, WebSocketModule],
  providers: [NotificationsService, PrismaService],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
