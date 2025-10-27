import { Module } from '@nestjs/common';
import { WebSocketGateway } from './websocket.gateway';
import { WebSocketService } from './websocket.service';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [
    DatabaseModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '24h' },
    }),
  ],
  providers: [WebSocketGateway, WebSocketService],
  exports: [WebSocketGateway, WebSocketService],
})
export class WebSocketModule {}
