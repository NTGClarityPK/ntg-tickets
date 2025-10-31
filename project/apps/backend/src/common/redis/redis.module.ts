import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { RedisService } from './redis.service';

@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
