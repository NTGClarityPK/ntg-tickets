export interface Notification {
  id: string;
  userId: string;
  ticketId?: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  ticket?: {
    id: string;
    ticketNumber: string;
    title: string;
  };
}

export type NotificationType =
  | 'TICKET_CREATED'
  | 'TICKET_ASSIGNED'
  | 'TICKET_STATUS_CHANGED'
  | 'COMMENT_ADDED'
  | 'SLA_WARNING'
  | 'SLA_BREACH'
  | 'TICKET_DUE'
  | 'TICKET_ESCALATED'
  | 'SYSTEM_ANNOUNCEMENT';
