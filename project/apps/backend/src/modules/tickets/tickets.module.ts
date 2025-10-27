import { Module } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { CommentsModule } from '../comments/comments.module';
import { AttachmentsModule } from '../attachments/attachments.module';
import { LoggerModule } from '../../common/logger/logger.module';
import { RedisModule } from '../../common/redis/redis.module';
import { ElasticsearchModule } from '../elasticsearch/elasticsearch.module';
import { AuthModule } from '../auth/auth.module';
import { SLAModule } from '../../common/sla/sla.module';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [
    NotificationsModule,
    CommentsModule,
    AttachmentsModule,
    LoggerModule,
    RedisModule,
    ElasticsearchModule,
    AuthModule,
    SLAModule,
    WebSocketModule,
  ],
  providers: [TicketsService, PrismaService],
  controllers: [TicketsController],
  exports: [TicketsService],
})
export class TicketsModule {}
