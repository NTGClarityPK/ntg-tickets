import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ElasticsearchService } from './elasticsearch.service';
import { ElasticsearchController } from './elasticsearch.controller';

@Module({
  imports: [
    ConfigModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  providers: [ElasticsearchService],
  controllers: [ElasticsearchController],
  exports: [ElasticsearchService],
})
export class ElasticsearchModule {}
