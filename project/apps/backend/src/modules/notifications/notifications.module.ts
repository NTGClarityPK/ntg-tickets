import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { SupabaseService } from '../../database/supabase.service';
import { EmailModule } from '../../common/email/email.module';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [EmailModule, WebSocketModule],
  providers: [NotificationsService],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
