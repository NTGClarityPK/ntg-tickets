import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ElasticsearchService } from './elasticsearch.service';
import { ElasticsearchController } from './elasticsearch.controller';

@Module({
  imports: [
    ConfigModule,
  ],
  providers: [ElasticsearchService],
  controllers: [ElasticsearchController],
  exports: [ElasticsearchService],
})
export class ElasticsearchModule {}
