import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaService } from '../../database/prisma.service';
import { ValidationService } from '../../common/validation/validation.service';
import { SystemConfigService } from '../../common/config/system-config.service';

@Module({
  providers: [
    UsersService,
    PrismaService,
    ValidationService,
    SystemConfigService,
  ],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
