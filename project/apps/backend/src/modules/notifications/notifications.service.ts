import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { NotificationType } from '@prisma/client';
import { EmailNotificationService } from '../../common/email/email-notification.service';
import { WebSocketService } from '../websocket/websocket.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private emailNotificationService: EmailNotificationService,
    private webSocketService: WebSocketService
  ) {}

  async create(notificationData: {
    userId: string;
    ticketId?: string;
    type: NotificationType;
    title: string;
    message: string;
  }) {
    try {
      const notification = await this.prisma.notification.create({
        data: notificationData,
        include: {
          user: true,
          ticket: {
            include: {
              requester: true,
              assignedTo: true,
            },
          },
        },
      });

      this.logger.log(`Notification created for user ${notification.userId}`);

      // Send email notification if applicable
      await this.sendEmailNotification(notification);

      return notification;
    } catch (error) {
      this.logger.error('Error creating notification:', error);
      throw error;
    }
  }

  async findAll(
    userId: string,
    params: { page?: number; limit?: number; unreadOnly?: boolean }
  ) {
    const { page = 1, limit = 20, unreadOnly = false } = params;
    const skip = (page - 1) * limit;

    const where: { userId: string; isRead?: boolean } = { userId };
    if (unreadOnly) {
      where.isRead = false;
    }

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          ticket: {
            include: {
              requester: true,
              assignedTo: true,
            },
          },
        },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      data: notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async markAsRead(notificationId: string, userId: string) {
    await this.prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        isRead: true,
      },
    });

    return { message: 'Notification marked as read' };
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return { message: 'All notifications marked as read' };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  async findByUserId(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async sendEmailNotification(notification: {
    id: string;
    userId: string;
    ticketId?: string;
    type: string;
    title: string;
    message: string;
    ticket?: {
      id: string;
      ticketNumber: string;
      title: string;
      requesterId: string;
      assignedToId?: string;
      description: string;
      status: string;
      priority: string;
      createdAt: Date;
    };
    user?: { id: string; name: string; email: string };
  }) {
    try {
      if (!notification.ticket) {
        return; // No ticket associated, skip email
      }

      const ticket = notification.ticket;
      const user = notification.user;

      switch (notification.type) {
        case 'TICKET_CREATED':
          // No email sent for ticket creation
          break;

        case 'TICKET_ASSIGNED':
          // Email is sent from tickets.service after assignment
          // to avoid duplicate emails (notification created for both requester and assignee)
          break;

        case 'TICKET_STATUS_CHANGED':
          // Email for status change is handled by workflow execution service
          // based on whether sendNotification is enabled for the transition
          break;

        case 'COMMENT_ADDED':
          // Get requester and assignee for comment notification
          const commentRequester = await this.prisma.user.findUnique({
            where: { id: ticket.requesterId },
            select: { id: true, name: true, email: true },
          });
          let commentAssignee = null;
          if (ticket.assignedToId) {
            commentAssignee = await this.prisma.user.findUnique({
              where: { id: ticket.assignedToId },
              select: { id: true, name: true, email: true },
            });
          }
          // Get comment data from notification metadata or fetch latest comment
          const latestComment = await this.prisma.comment.findFirst({
            where: { ticketId: ticket.id },
            orderBy: { createdAt: 'desc' },
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          });
          if (commentRequester && latestComment && latestComment.user) {
            await this.emailNotificationService.sendCommentAddedEmail(
              ticket,
              latestComment.user,
              commentRequester,
              commentAssignee,
              {
                id: latestComment.id,
                content: latestComment.content,
                createdAt: latestComment.createdAt,
              }
            );
          }
          break;

        case 'SLA_WARNING':
        case 'SLA_BREACH':
          // Email templates for SLA warnings/breaches removed
          // These notifications will still be created but no emails sent
          break;
      }
    } catch (error) {
      this.logger.error('Error sending email notification:', error);
      // Don't throw error to avoid breaking notification creation
    }
  }

  async sendBulkNotification(ticketIds: string[], message: string) {
    let sent = 0;
    let failed = 0;

    try {
      // Get tickets with their requesters
      const tickets = await this.prisma.ticket.findMany({
        where: {
          id: { in: ticketIds },
        },
        include: {
          requester: true,
        },
      });

      // Send notification to each ticket's requester
      for (const ticket of tickets) {
        try {
          if (ticket.requester) {
            // Create notification in database
            await this.prisma.notification.create({
              data: {
                userId: ticket.requester.id,
                ticketId: ticket.id,
                type: 'TICKET_STATUS_CHANGED',
                title: 'Message from Support',
                message: message,
              },
            });

            // Send real-time notification via WebSocket
            this.webSocketService.notifyUser(ticket.requester.id, {
              type: 'NOTIFICATION',
              title: 'Message from Support',
              message: message,
              data: {
                ticketId: ticket.id,
                ticketNumber: ticket.ticketNumber,
              },
            });

            sent++;
          }
        } catch (error) {
          this.logger.error(
            `Failed to send notification for ticket ${ticket.id}:`,
            error
          );
          failed++;
        }
      }

      this.logger.log(
        `Bulk notification completed: ${sent} sent, ${failed} failed`
      );

      return { sent, failed };
    } catch (error) {
      this.logger.error('Error in bulk notification:', error);
      throw error;
    }
  }
}
