import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { NotificationsService } from '../../notifications/notifications.service';
import { WebSocketService } from '../../websocket/websocket.service';

@Processor('notifications')
export class NotificationProcessor {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    private notificationsService: NotificationsService,
    private webSocketService: WebSocketService
  ) {}

  @Process('send-notification')
  async handleSendNotification(job: Job) {
    try {
      const { userId, type, title, message, ticketId } = job.data;

      this.logger.log(
        `Processing notification job ${job.id} for user ${userId}`
      );

      // Create notification in database
      const notification = await this.notificationsService.create({
        userId,
        ticketId,
        type,
        title,
        message,
      });

      // Send real-time notification via WebSocket
      this.webSocketService.notifyUser(userId, {
        type: 'NOTIFICATION',
        title: notification.title,
        message: notification.message,
        data: notification,
      });

      this.logger.log(`Notification job ${job.id} completed successfully`);
    } catch (error) {
      this.logger.error(`Notification job ${job.id} failed:`, error);
      throw error;
    }
  }
}
