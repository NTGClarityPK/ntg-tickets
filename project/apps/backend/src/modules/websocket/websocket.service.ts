import { Injectable, Logger } from '@nestjs/common';
import { WebSocketGateway } from './websocket.gateway';

@Injectable()
export class WebSocketService {
  private readonly logger = new Logger(WebSocketService.name);

  constructor(private webSocketGateway: WebSocketGateway) {}

  notifyTicketUpdate(
    ticketId: string,
    userId: string,
    update: Record<string, unknown>
  ) {
    this.webSocketGateway.sendToUser(userId, 'TICKET_UPDATE', {
      ticketId,
      update,
      timestamp: new Date().toISOString(),
    });
  }

  notifyCommentAdded(
    ticketId: string,
    userId: string,
    comment: { id: string; content: string; authorId: string; createdAt: Date }
  ) {
    this.webSocketGateway.sendToUser(userId, 'COMMENT_ADDED', {
      ticketId,
      comment,
      timestamp: new Date().toISOString(),
    });
  }

  notifyTicketAssigned(
    ticketId: string,
    assigneeId: string,
    ticket: {
      id: string;
      ticketNumber: string;
      title: string;
      priority: string;
      status: string;
    }
  ) {
    this.webSocketGateway.sendToUser(assigneeId, 'TICKET_ASSIGNED', {
      ticketId,
      ticket,
      timestamp: new Date().toISOString(),
    });
  }

  notifyUser(
    userId: string,
    notification: {
      type: string;
      title: string;
      message: string;
      data?: Record<string, unknown>;
    }
  ) {
    this.webSocketGateway.sendToUser(userId, 'NOTIFICATION', {
      ...notification,
      timestamp: new Date().toISOString(),
    });
  }

  notifySLAWarning(
    ticketId: string,
    userId: string,
    warning: { message: string; dueDate: Date; priority: string }
  ) {
    this.webSocketGateway.sendToUser(userId, 'SLA_WARNING', {
      ticketId,
      warning,
      timestamp: new Date().toISOString(),
    });
  }
}
