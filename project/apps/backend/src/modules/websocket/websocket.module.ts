import { Module } from '@nestjs/common';
import { WebSocketGateway } from './websocket.gateway';
import { WebSocketService } from './websocket.service';
import { DatabaseModule } from '../../database/database.module';
import { SupabaseModule } from '../../common/supabase/supabase.module';

@Module({
  imports: [
    DatabaseModule,
    SupabaseModule,
  ],
  providers: [WebSocketGateway, WebSocketService],
  exports: [WebSocketGateway, WebSocketService],
})
export class WebSocketModule {}
