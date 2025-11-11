import { Module } from '@nestjs/common';
import { WebSocketGateway } from './websocket.gateway';
import { WebSocketService } from './websocket.service';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../database/database.module';
import { AppConfigService } from '../../config/app-config.service';

@Module({
  imports: [
    DatabaseModule,
    JwtModule.registerAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        secret: config.jwt.secret,
        signOptions: { expiresIn: config.jwt.expiresIn },
      }),
    }),
  ],
  providers: [WebSocketGateway, WebSocketService],
  exports: [WebSocketGateway, WebSocketService],
})
export class WebSocketModule {}
