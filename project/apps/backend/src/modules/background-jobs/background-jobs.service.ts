import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Cron, CronExpression } from '@nestjs/schedule';

export interface EmailJobData {
  to: string;
  subject: string;
  html: string;
  templateType?: string;
  data?: Record<string, unknown>;
}

export interface ReportJobData {
  userId: string;
  reportType: string;
  parameters: Record<string, unknown>;
  emailTo?: string;
}

export interface NotificationJobData {
  userId: string;
  type: string;
  title: string;
  message: string;
  ticketId?: string;
}

@Injectable()
export class BackgroundJobsService {
  private readonly logger = new Logger(BackgroundJobsService.name);

  constructor(
    @InjectQueue('email') private emailQueue: Queue,
    @InjectQueue('reports') private reportsQueue: Queue,
    @InjectQueue('notifications') private notificationsQueue: Queue,
    @InjectQueue('auto-close') private autoCloseQueue: Queue
  ) {}

  async sendEmail(data: EmailJobData, delay?: number) {
    try {
      const job = await this.emailQueue.add('send-email', data, {
        delay: delay || 0,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      });

      this.logger.log(`Email job queued: ${job.id}`);
      return job;
    } catch (error) {
      this.logger.error('Error queuing email job:', error);
      throw error;
    }
  }

  async generateReport(data: ReportJobData, delay?: number) {
    try {
      const job = await this.reportsQueue.add('generate-report', data, {
        delay: delay || 0,
        attempts: 2,
        backoff: {
          type: 'fixed',
          delay: 5000,
        },
      });

      this.logger.log(`Report job queued: ${job.id}`);
      return job;
    } catch (error) {
      this.logger.error('Error queuing report job:', error);
      throw error;
    }
  }

  async sendNotification(data: NotificationJobData, delay?: number) {
    try {
      const job = await this.notificationsQueue.add('send-notification', data, {
        delay: delay || 0,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      });

      this.logger.log(`Notification job queued: ${job.id}`);
      return job;
    } catch (error) {
      this.logger.error('Error queuing notification job:', error);
      throw error;
    }
  }

  async scheduleSLAWarning(ticketId: string, dueDate: Date, userId: string) {
    try {
      const now = new Date();
      const warningTime = new Date(dueDate.getTime() - 24 * 60 * 60 * 1000); // 24 hours before due date
      const delay = Math.max(0, warningTime.getTime() - now.getTime());

      if (delay > 0) {
        await this.sendNotification(
          {
            userId,
            type: 'SLA_WARNING',
            title: 'SLA Warning',
            message: `Ticket ${ticketId} is approaching its SLA deadline`,
            ticketId,
          },
          delay
        );

        this.logger.log(`SLA warning scheduled for ticket ${ticketId}`);
      }
    } catch (error) {
      this.logger.error('Error scheduling SLA warning:', error);
      throw error;
    }
  }

  async scheduleAutoClose(
    ticketId: string,
    resolvedDate: Date,
    userId: string
  ) {
    try {
      const autoCloseTime = new Date(
        resolvedDate.getTime() + 5 * 24 * 60 * 60 * 1000
      ); // 5 days after resolution
      const now = new Date();
      const delay = Math.max(0, autoCloseTime.getTime() - now.getTime());

      if (delay > 0) {
        await this.sendNotification(
          {
            userId,
            type: 'AUTO_CLOSE_WARNING',
            title: 'Ticket Auto-Close Warning',
            message: `Ticket ${ticketId} will be automatically closed in 24 hours`,
            ticketId,
          },
          delay - 24 * 60 * 60 * 1000
        ); // 24 hours before auto-close

        this.logger.log(`Auto-close warning scheduled for ticket ${ticketId}`);
      }
    } catch (error) {
      this.logger.error('Error scheduling auto-close:', error);
      throw error;
    }
  }

  async scheduleDailyReports() {
    try {
      // Schedule daily reports at 9 AM every day
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);

      const delay = tomorrow.getTime() - now.getTime();

      await this.reportsQueue.add(
        'daily-reports',
        {},
        {
          delay,
          repeat: { cron: '0 9 * * *' }, // Every day at 9 AM
        }
      );

      this.logger.log('Daily reports scheduled');
    } catch (error) {
      this.logger.error('Error scheduling daily reports:', error);
      throw error;
    }
  }

  async getQueueStats() {
    try {
      const [emailStats, reportsStats, notificationsStats] = await Promise.all([
        this.emailQueue.getJobCounts(),
        this.reportsQueue.getJobCounts(),
        this.notificationsQueue.getJobCounts(),
      ]);

      return {
        email: emailStats,
        reports: reportsStats,
        notifications: notificationsStats,
      };
    } catch (error) {
      this.logger.error('Error getting queue stats:', error);
      throw error;
    }
  }

  // SLA monitoring is now handled by SLAEscalationService with cron jobs

  async clearQueue(queueName: string) {
    try {
      let queue: Queue;
      switch (queueName) {
        case 'email':
          queue = this.emailQueue;
          break;
        case 'reports':
          queue = this.reportsQueue;
          break;
        case 'notifications':
          queue = this.notificationsQueue;
          break;
        default:
          throw new Error(`Unknown queue: ${queueName}`);
      }

      await queue.empty();
      this.logger.log(`Queue ${queueName} cleared`);
    } catch (error) {
      this.logger.error(`Error clearing queue ${queueName}:`, error);
      throw error;
    }
  }

  // Schedule auto-close job to run daily at 2 AM
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async scheduleDailyAutoClose() {
    try {
      await this.autoCloseQueue.add(
        'close-resolved-tickets',
        {},
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        }
      );
      this.logger.log('Auto-close job scheduled');
    } catch (error) {
      this.logger.error('Error scheduling auto-close job:', error);
    }
  }
}
