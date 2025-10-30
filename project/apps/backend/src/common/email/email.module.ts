import { Global, Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailNotificationService } from './email-notification.service';
import { DatabaseModule } from '../../database/database.module';

@Global()
@Module({
  imports: [DatabaseModule],
  providers: [EmailService, EmailNotificationService],
  exports: [EmailService, EmailNotificationService],
})
export class EmailModule {}
