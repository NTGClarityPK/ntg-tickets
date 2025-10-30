import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';
import { SLAService } from '../../common/sla/sla.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailNotificationService } from '../../common/email/email-notification.service';
import { WebSocketGateway } from '../websocket/websocket.gateway';

@Injectable()
export class SLAEscalationService {
  private readonly logger = new Logger(SLAEscalationService.name);

  constructor(
    private prisma: PrismaService,
    private slaService: SLAService,
    private notificationsService: NotificationsService,
    private emailNotificationService: EmailNotificationService,
    private websocketGateway: WebSocketGateway
  ) {}

  /**
   * Check for SLA breaches and warnings every 15 minutes
   */
  @Cron('0 */15 * * * *') // Every 15 minutes
  async checkSLACompliance() {
    this.logger.log('Starting SLA compliance check');

    try {
      await Promise.all([
        this.checkSLAWarnings(),
        this.checkSLABreaches(),
        this.autoEscalateBreachedTickets(),
      ]);

      this.logger.log('SLA compliance check completed');
    } catch (error) {
      this.logger.error('Error during SLA compliance check:', error);
    }
  }

  /**
   * Check for tickets approaching SLA deadline (within 2 hours)
   */
  private async checkSLAWarnings() {
    try {
      const approachingTickets =
        await this.slaService.getTicketsApproachingSLA();

      for (const ticket of approachingTickets) {
        // Check if we've already sent a warning for this ticket
        const existingWarning = await this.prisma.notification.findFirst({
          where: {
            ticketId: ticket.id,
            type: 'SLA_WARNING',
            createdAt: {
              gte: new Date(Date.now() - 2 * 60 * 60 * 1000), // Within last 2 hours
            },
          },
        });

        if (!existingWarning) {
          await this.sendSLAWarning({
            ...ticket,
            description: '',
            createdAt: new Date(),
          });
        }
      }
    } catch (error) {
      this.logger.error('Error checking SLA warnings:', error);
    }
  }

  /**
   * Check for tickets that have breached SLA
   */
  private async checkSLABreaches() {
    try {
      const breachedTickets = await this.slaService.getBreachedSLATickets();

      for (const ticket of breachedTickets) {
        // Check if we've already sent a breach notification for this ticket
        const existingBreach = await this.prisma.notification.findFirst({
          where: {
            ticketId: ticket.id,
            type: 'SLA_BREACH',
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Within last 24 hours
            },
          },
        });

        if (!existingBreach) {
          await this.sendSLABreach({
            ...ticket,
            description: '',
            createdAt: new Date(),
          });
        }
      }
    } catch (error) {
      this.logger.error('Error checking SLA breaches:', error);
    }
  }

  /**
   * Auto-escalate tickets that have breached SLA
   */
  private async autoEscalateBreachedTickets() {
    try {
      const breachedTickets = await this.slaService.getBreachedSLATickets();

      for (const ticket of breachedTickets) {
        // Only escalate if ticket is not already escalated and not assigned to a manager
        if (!this.isTicketEscalated(ticket)) {
          await this.escalateTicket(ticket);
        }
      }
    } catch (error) {
      this.logger.error('Error auto-escalating tickets:', error);
    }
  }

  /**
   * Send SLA warning notification
   */
  private async sendSLAWarning(ticket: {
    id: string;
    ticketNumber: string;
    title: string;
    dueDate: Date;
    priority: string;
    requesterId: string;
    assignedToId?: string;
    description: string;
    status: string;
    createdAt: Date;
  }) {
    try {
      // Get ticket with relations for recipients
      const ticketWithRelations = await this.prisma.ticket.findUnique({
        where: { id: ticket.id },
        include: {
          requester: { select: { id: true, name: true, email: true } },
          assignedTo: { select: { id: true, name: true, email: true } },
        },
      });

      if (!ticketWithRelations) {
        this.logger.warn(`Ticket ${ticket.id} not found for SLA warning`);
        return;
      }

      const recipients = this.getSLAWarningRecipients(ticketWithRelations);

      for (const recipient of recipients) {
        // Create notification
        await this.notificationsService.create({
          userId: recipient.id,
          ticketId: ticket.id,
          type: 'SLA_WARNING',
          title: 'SLA Warning',
          message: `Ticket ${ticket.ticketNumber} is approaching its SLA deadline. Due: ${ticket.dueDate}`,
        });

        // Send email
        await this.emailNotificationService.sendSLAWarningEmail(
          ticketWithRelations,
          recipient
        );

        // Send WebSocket notification
        this.websocketGateway.sendToUser(recipient.id, 'sla_warning', ticket);
      }

      this.logger.log(`SLA warning sent for ticket ${ticket.ticketNumber}`);
    } catch (error) {
      this.logger.error(
        `Error sending SLA warning for ticket ${ticket.ticketNumber}:`,
        error
      );
    }
  }

  /**
   * Send SLA breach notification
   */
  private async sendSLABreach(ticket: {
    id: string;
    ticketNumber: string;
    title: string;
    dueDate: Date;
    priority: string;
    requesterId: string;
    assignedToId?: string;
    description: string;
    status: string;
    createdAt: Date;
  }) {
    try {
      // Get ticket with relations for recipients
      const ticketWithRelations = await this.prisma.ticket.findUnique({
        where: { id: ticket.id },
        include: {
          requester: { select: { id: true, name: true, email: true } },
          assignedTo: { select: { id: true, name: true, email: true } },
        },
      });

      if (!ticketWithRelations) {
        this.logger.warn(`Ticket ${ticket.id} not found for SLA breach`);
        return;
      }

      const recipients = await this.getSLABreachRecipients(ticketWithRelations);

      for (const recipient of recipients) {
        // Create notification
        await this.notificationsService.create({
          userId: recipient.id,
          ticketId: ticket.id,
          type: 'SLA_BREACH',
          title: 'SLA Breach',
          message: `Ticket ${ticket.ticketNumber} has breached its SLA deadline. Due: ${ticket.dueDate}`,
        });

        // Send email
        await this.emailNotificationService.sendSLABreachEmail(
          ticketWithRelations,
          recipient
        );

        // Send WebSocket notification
        this.websocketGateway.sendToUser(recipient.id, 'sla_breach', ticket);
      }

      this.logger.log(
        `SLA breach notification sent for ticket ${ticket.ticketNumber}`
      );
    } catch (error) {
      this.logger.error(
        `Error sending SLA breach notification for ticket ${ticket.ticketNumber}:`,
        error
      );
    }
  }

  /**
   * Escalate a ticket to a support manager
   */
  private async escalateTicket(ticket: {
    id: string;
    ticketNumber: string;
    title: string;
    dueDate: Date;
    priority: string;
    requesterId: string;
    assignedToId?: string;
  }) {
    try {
      // Find available support managers
      const managers = await this.prisma.user.findMany({
        where: {
          roles: { has: 'SUPPORT_MANAGER' },
          isActive: true,
        },
        orderBy: {
          assignedTickets: {
            _count: 'asc',
          },
        },
      });

      if (managers.length === 0) {
        this.logger.warn(
          `No support managers available to escalate ticket ${ticket.ticketNumber}`
        );
        return;
      }

      // Assign to the manager with the least tickets
      const manager = managers[0];

      // Update ticket
      await this.prisma.ticket.update({
        where: { id: ticket.id },
        data: {
          assignedToId: manager.id,
          priority: this.getEscalatedPriority(ticket.priority) as
            | 'LOW'
            | 'MEDIUM'
            | 'HIGH'
            | 'CRITICAL',
          updatedAt: new Date(),
        },
      });

      // Create escalation notification
      await this.notificationsService.create({
        userId: manager.id,
        ticketId: ticket.id,
        type: 'TICKET_ESCALATED',
        title: 'Ticket Escalated',
        message: `Ticket ${ticket.ticketNumber} has been escalated due to SLA breach and assigned to you.`,
      });

      // Notify requester
      await this.notificationsService.create({
        userId: ticket.requesterId,
        ticketId: ticket.id,
        type: 'TICKET_ESCALATED',
        title: 'Ticket Escalated',
        message: `Your ticket ${ticket.ticketNumber} has been escalated to a support manager due to SLA breach.`,
      });

      // Send WebSocket notifications
      this.websocketGateway.sendToUser(manager.id, 'ticket_escalated', ticket);
      this.websocketGateway.sendToUser(
        ticket.requesterId,
        'ticket_escalated',
        ticket
      );

      this.logger.log(
        `Ticket ${ticket.ticketNumber} escalated to manager ${manager.email}`
      );
    } catch (error) {
      this.logger.error(
        `Error escalating ticket ${ticket.ticketNumber}:`,
        error
      );
    }
  }

  /**
   * Get recipients for SLA warning notifications
   */
  private getSLAWarningRecipients(ticket: {
    requester: { id: string; name: string; email: string };
    assignedTo?: { id: string; name: string; email: string };
  }) {
    const recipients = [ticket.requester];

    if (ticket.assignedTo) {
      recipients.push(ticket.assignedTo);
    }

    return recipients;
  }

  /**
   * Get recipients for SLA breach notifications
   */
  private async getSLABreachRecipients(ticket: {
    requester: { id: string; name: string; email: string };
    assignedTo?: { id: string; name: string; email: string };
  }) {
    const recipients = [ticket.requester];

    if (ticket.assignedTo) {
      recipients.push(ticket.assignedTo);
    }

    // Add support managers
    const managers = await this.prisma.user.findMany({
      where: {
        roles: { has: 'SUPPORT_MANAGER' },
        isActive: true,
      },
    });

    recipients.push(...managers);

    return recipients;
  }

  /**
   * Check if ticket is already escalated
   */
  private isTicketEscalated(ticket: {
    assignedTo?: { role: string };
    priority: string;
  }): boolean {
    // Check if assigned to a manager
    if (
      ticket.assignedTo &&
      ['SUPPORT_MANAGER', 'ADMIN'].includes(ticket.assignedTo.role)
    ) {
      return true;
    }

    // Check if priority is already escalated
    if (ticket.priority === 'CRITICAL') {
      return true;
    }

    return false;
  }

  /**
   * Get escalated priority level
   */
  private getEscalatedPriority(currentPriority: string): string {
    const priorityLevels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const currentIndex = priorityLevels.indexOf(currentPriority);

    if (currentIndex < priorityLevels.length - 1) {
      return priorityLevels[currentIndex + 1];
    }

    return 'CRITICAL';
  }

  /**
   * Manual escalation trigger
   */
  async manualEscalate(ticketId: string, escalatedBy: string) {
    try {
      const ticket = await this.prisma.ticket.findUnique({
        where: { id: ticketId },
        include: {
          requester: true,
          assignedTo: true,
        },
      });

      if (!ticket) {
        throw new Error('Ticket not found');
      }

      await this.escalateTicket(ticket);

      this.logger.log(
        `Ticket ${ticket.ticketNumber} manually escalated by ${escalatedBy}`
      );
    } catch (error) {
      this.logger.error(`Error in manual escalation:`, error);
      throw error;
    }
  }
}
