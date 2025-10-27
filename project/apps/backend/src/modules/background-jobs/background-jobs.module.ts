import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { BackgroundJobsService } from './background-jobs.service';
import { EmailProcessor } from './processors/email.processor';
import { ReportProcessor } from './processors/report.processor';
import { NotificationProcessor } from './processors/notification.processor';
import { AutoCloseProcessor } from './processors/auto-close.processor';
import { SLAEscalationService } from './sla-escalation.service';
import { EmailModule } from '../../common/email/email.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ReportsModule } from '../reports/reports.module';
import { TicketsModule } from '../tickets/tickets.module';
import { SLAModule } from '../../common/sla/sla.module';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    BullModule.registerQueue(
      { name: 'email' },
      { name: 'reports' },
      { name: 'notifications' },
      { name: 'auto-close' }
    ),
    EmailModule,
    NotificationsModule,
    ReportsModule,
    TicketsModule,
    SLAModule,
    WebSocketModule,
  ],
  providers: [
    BackgroundJobsService,
    EmailProcessor,
    ReportProcessor,
    NotificationProcessor,
    AutoCloseProcessor,
    SLAEscalationService,
  ],
  exports: [BackgroundJobsService, SLAEscalationService],
})
export class BackgroundJobsModule {}
