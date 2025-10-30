import { Module } from '@nestjs/common';
import { CustomFieldsController } from './custom-fields.controller';
import { CustomFieldsService } from './custom-fields.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [CustomFieldsController],
  providers: [CustomFieldsService],
  exports: [CustomFieldsService],
})
export class CustomFieldsModule {}
