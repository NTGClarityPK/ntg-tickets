import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { EmailService } from './email.service';

// Define proper types for email notifications
interface TicketWithRelations {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  createdAt: Date;
  requester?: {
    id: string;
    name: string;
    email: string;
  };
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  };
  category?: {
    name: string;
  };
  subcategory?: {
    name: string;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  user?: {
    name: string;
  };
}

interface TemplateVariables {
  [key: string]: string | number | Date | object | undefined;
}

@Injectable()
export class EmailNotificationService {
  private readonly logger = new Logger(EmailNotificationService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService
  ) {}

  async sendTicketCreatedEmail(ticket: TicketWithRelations, user: User) {
    try {
      const template = await this.getEmailTemplate('TICKET_CREATED');
      if (!template) {
        this.logger.warn('No email template found for TICKET_CREATED');
        return;
      }

      const subject = this.replaceTemplateVariables(template.subject, {
        ticket,
        user,
      });
      const html = this.replaceTemplateVariables(template.html, {
        ticket,
        user,
      });

      await this.emailService.sendEmail(user.email, subject, html, {});

      this.logger.log(`Ticket created email sent to ${user.email}`);
    } catch (error) {
      this.logger.error('Error sending ticket created email:', error);
    }
  }

  async sendTicketAssignedEmail(
    ticket: TicketWithRelations,
    assignee: User,
    requester: User
  ) {
    try {
      const template = await this.getEmailTemplate('TICKET_ASSIGNED');
      if (!template) {
        this.logger.warn('No email template found for TICKET_ASSIGNED');
        return;
      }

      const subject = this.replaceTemplateVariables(template.subject, {
        ticket,
        assignee,
        requester,
      });
      const html = this.replaceTemplateVariables(template.html, {
        ticket,
        assignee,
        requester,
      });

      // Send to assignee
      await this.emailService.sendEmail(assignee.email, subject, html, {});

      // Send to requester
      const requesterSubject = this.replaceTemplateVariables(template.subject, {
        ticket,
        assignee,
        requester,
        recipient: 'requester',
      });
      const requesterHtml = this.replaceTemplateVariables(template.html, {
        ticket,
        assignee,
        requester,
        recipient: 'requester',
      });

      await this.emailService.sendEmail(
        requester.email,
        requesterSubject,
        requesterHtml,
        {}
      );

      this.logger.log(`Ticket assigned emails sent`);
    } catch (error) {
      this.logger.error('Error sending ticket assigned email:', error);
    }
  }

  async sendTicketStatusChangedEmail(
    ticket: TicketWithRelations,
    user: User,
    oldStatus: string,
    newStatus: string
  ) {
    try {
      const template = await this.getEmailTemplate('TICKET_STATUS_CHANGED');
      if (!template) {
        this.logger.warn('No email template found for TICKET_STATUS_CHANGED');
        return;
      }

      const subject = this.replaceTemplateVariables(template.subject, {
        ticket,
        user,
        oldStatus,
        newStatus,
      });
      const html = this.replaceTemplateVariables(template.html, {
        ticket,
        user,
        oldStatus,
        newStatus,
      });

      await this.emailService.sendEmail(user.email, subject, html, {});

      this.logger.log(`Ticket status changed email sent to ${user.email}`);
    } catch (error) {
      this.logger.error('Error sending ticket status changed email:', error);
    }
  }

  async sendCommentAddedEmail(
    ticket: TicketWithRelations,
    commenter: User,
    recipient: User,
    comment: Comment
  ) {
    try {
      const template = await this.getEmailTemplate('COMMENT_ADDED');
      if (!template) {
        this.logger.warn('No email template found for COMMENT_ADDED');
        return;
      }

      const subject = this.replaceTemplateVariables(template.subject, {
        ticket,
        commenter,
        recipient,
        comment,
      });
      const html = this.replaceTemplateVariables(template.html, {
        ticket,
        commenter,
        recipient,
        comment,
      });

      await this.emailService.sendEmail(recipient.email, subject, html, {});

      this.logger.log(`Comment added email sent to ${recipient.email}`);
    } catch (error) {
      this.logger.error('Error sending comment added email:', error);
    }
  }

  async sendSLAWarningEmail(ticket: TicketWithRelations, user: User) {
    try {
      const template = await this.getEmailTemplate('SLA_WARNING');
      if (!template) {
        this.logger.warn('No email template found for SLA_WARNING');
        return;
      }

      const subject = this.replaceTemplateVariables(template.subject, {
        ticket,
        user,
      });
      const html = this.replaceTemplateVariables(template.html, {
        ticket,
        user,
      });

      await this.emailService.sendEmail(user.email, subject, html, {});

      this.logger.log(`SLA warning email sent to ${user.email}`);
    } catch (error) {
      this.logger.error('Error sending SLA warning email:', error);
    }
  }

  async sendSLABreachEmail(ticket: TicketWithRelations, user: User) {
    try {
      const template = await this.getEmailTemplate('SLA_BREACH');
      if (!template) {
        this.logger.warn('No email template found for SLA_BREACH');
        return;
      }

      const subject = this.replaceTemplateVariables(template.subject, {
        ticket,
        user,
      });
      const html = this.replaceTemplateVariables(template.html, {
        ticket,
        user,
      });

      await this.emailService.sendEmail(user.email, subject, html, {});

      this.logger.log(`SLA breach email sent to ${user.email}`);
    } catch (error) {
      this.logger.error('Error sending SLA breach email:', error);
    }
  }

  private async getEmailTemplate(type: string) {
    try {
      const template = await this.prisma.emailTemplate.findUnique({
        where: { type },
      });

      if (!template) {
        // Return default template if none exists
        return this.getDefaultTemplate(type);
      }

      return template;
    } catch (error) {
      this.logger.error('Error getting email template:', error);
      return this.getDefaultTemplate(type);
    }
  }

  private getDefaultTemplate(type: string) {
    const templates = {
      TICKET_CREATED: {
        subject: 'Ticket Created: {{ticket.ticketNumber}}',
        html: `
          <h2>Ticket Created Successfully</h2>
          <p>Hello {{user.name}},</p>
          <p>Your ticket has been created successfully.</p>
          <p><strong>Ticket Number:</strong> {{ticket.ticketNumber}}</p>
          <p><strong>Title:</strong> {{ticket.title}}</p>
          <p><strong>Priority:</strong> {{ticket.priority}}</p>
          <p><strong>Status:</strong> {{ticket.status}}</p>
          <p>You can view your ticket at: <a href="{{ticket.url}}">{{ticket.url}}</a></p>
        `,
      },
      TICKET_ASSIGNED: {
        subject: 'Ticket Assigned: {{ticket.ticketNumber}}',
        html: `
          <h2>Ticket Assigned</h2>
          <p>Hello {{assignee.name}},</p>
          <p>A new ticket has been assigned to you.</p>
          <p><strong>Ticket Number:</strong> {{ticket.ticketNumber}}</p>
          <p><strong>Title:</strong> {{ticket.title}}</p>
          <p><strong>Priority:</strong> {{ticket.priority}}</p>
          <p><strong>Requester:</strong> {{requester.name}}</p>
          <p>You can view the ticket at: <a href="{{ticket.url}}">{{ticket.url}}</a></p>
        `,
      },
      TICKET_STATUS_CHANGED: {
        subject: 'Ticket Status Updated: {{ticket.ticketNumber}}',
        html: `
          <h2>Ticket Status Updated</h2>
          <p>Hello {{user.name}},</p>
          <p>The status of your ticket has been updated.</p>
          <p><strong>Ticket Number:</strong> {{ticket.ticketNumber}}</p>
          <p><strong>Title:</strong> {{ticket.title}}</p>
          <p><strong>Status:</strong> {{oldStatus}} → {{newStatus}}</p>
          <p>You can view your ticket at: <a href="{{ticket.url}}">{{ticket.url}}</a></p>
        `,
      },
      COMMENT_ADDED: {
        subject: 'New Comment on Ticket: {{ticket.ticketNumber}}',
        html: `
          <h2>New Comment Added</h2>
          <p>Hello {{recipient.name}},</p>
          <p>A new comment has been added to ticket {{ticket.ticketNumber}}.</p>
          <p><strong>Comment by:</strong> {{commenter.name}}</p>
          <p><strong>Comment:</strong></p>
          <p>{{comment.content}}</p>
          <p>You can view the ticket at: <a href="{{ticket.url}}">{{ticket.url}}</a></p>
        `,
      },
      SLA_WARNING: {
        subject: 'SLA Warning: {{ticket.ticketNumber}}',
        html: `
          <h2>SLA Warning</h2>
          <p>Hello {{user.name}},</p>
          <p>This is a warning that ticket {{ticket.ticketNumber}} is approaching its SLA deadline.</p>
          <p><strong>Ticket:</strong> {{ticket.title}}</p>
          <p><strong>Due Date:</strong> {{ticket.dueDate}}</p>
          <p>Please take action to resolve this ticket before the deadline.</p>
        `,
      },
      SLA_BREACH: {
        subject: 'SLA Breach: {{ticket.ticketNumber}}',
        html: `
          <h2>SLA Breach Alert</h2>
          <p>Hello {{user.name}},</p>
          <p>Ticket {{ticket.ticketNumber}} has breached its SLA deadline.</p>
          <p><strong>Ticket:</strong> {{ticket.title}}</p>
          <p><strong>Due Date:</strong> {{ticket.dueDate}}</p>
          <p>Immediate action is required to resolve this ticket.</p>
        `,
      },
    };

    return templates[type] || null;
  }

  private replaceTemplateVariables(
    template: string,
    variables: TemplateVariables
  ): string {
    let result = template;

    // Replace simple variables like {{ticket.title}}
    result = result.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      const value = this.getNestedValue(variables, path.trim());
      return value !== undefined ? String(value) : match;
    });

    return result;
  }

  private getNestedValue(obj: TemplateVariables, path: string): string {
    const result = path.split('.').reduce((current: unknown, key: string) => {
      return current &&
        typeof current === 'object' &&
        current !== null &&
        key in current
        ? (current as Record<string, unknown>)[key]
        : undefined;
    }, obj);
    return result ? String(result) : '';
  }
}
