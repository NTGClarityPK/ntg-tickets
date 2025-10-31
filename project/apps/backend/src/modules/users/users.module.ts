import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { ValidationService } from '../../common/validation/validation.service';
import { SystemConfigService } from '../../common/config/system-config.service';

@Module({
  imports: [DatabaseModule],
  providers: [
    UsersService,
    ValidationService,
    SystemConfigService,
  ],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
