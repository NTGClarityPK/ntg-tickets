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

  // Removed sendTicketCreatedEmail - no longer needed

  async sendTicketAssignedEmail(
    ticket: TicketWithRelations,
    assignee: User,
    requester: User
  ) {
    try {
      const template = await this.getEmailTemplate('TICKET_ASSIGNED');
      if (!template) {
        this.logger.warn('No active email template found for TICKET_ASSIGNED');
        return;
      }

      // Send to assignee
      const assigneeSubject = this.replaceTemplateVariables(template.subject, {
        ticket,
        assignee,
        requester,
        user: assignee,
      });
      const assigneeHtml = this.replaceTemplateVariables(template.html, {
        ticket,
        assignee,
        requester,
        user: assignee,
      });
      await this.emailService.sendEmail(assignee.email, assigneeSubject, assigneeHtml, {});
      this.logger.log(`Ticket assigned email sent to assignee ${assignee.email}`);

      // Send to requester (if different from assignee)
      if (requester.id !== assignee.id) {
        const requesterSubject = this.replaceTemplateVariables(template.subject, {
          ticket,
          assignee,
          requester,
          user: requester,
        });
        const requesterHtml = this.replaceTemplateVariables(template.html, {
          ticket,
          assignee,
          requester,
          user: requester,
        });
        await this.emailService.sendEmail(requester.email, requesterSubject, requesterHtml, {});
        this.logger.log(`Ticket assigned email sent to requester ${requester.email}`);
      }
    } catch (error) {
      this.logger.error('Error sending ticket assigned email:', error);
    }
  }

  async sendTicketUpdateEmail(
    ticket: TicketWithRelations,
    requester: User
  ) {
    try {
      const template = await this.getEmailTemplate('TICKET_UPDATE');
      if (!template) {
        this.logger.warn('No email template found for TICKET_UPDATE');
        return;
      }

      const subject = this.replaceTemplateVariables(template.subject, {
        ticket,
        requester,
      });
      const html = this.replaceTemplateVariables(template.html, {
        ticket,
        requester,
      });

      // Send only to requester
      await this.emailService.sendEmail(requester.email, subject, html, {});

      this.logger.log(`Ticket update email sent to ${requester.email}`);
    } catch (error) {
      this.logger.error('Error sending ticket update email:', error);
    }
  }

  async sendCommentAddedEmail(
    ticket: TicketWithRelations,
    commenter: User,
    requester: User,
    assignee: User | null,
    comment: Comment
  ) {
    try {
      const template = await this.getEmailTemplate('COMMENT_ADDED');
      if (!template) {
        this.logger.warn('No email template found for COMMENT_ADDED');
        return;
      }

      // Send to requester
      const requesterSubject = this.replaceTemplateVariables(template.subject, {
        ticket,
        user: requester,
        comment: {
          ...comment,
          author: commenter.name,
          authorEmail: commenter.email,
        },
      });
      const requesterHtml = this.replaceTemplateVariables(template.html, {
        ticket,
        user: requester,
        comment: {
          ...comment,
          author: commenter.name,
          authorEmail: commenter.email,
        },
      });

      await this.emailService.sendEmail(
        requester.email,
        requesterSubject,
        requesterHtml,
        {}
      );
      this.logger.log(`Comment added email sent to requester ${requester.email}`);

      // Send to assignee if exists
      if (assignee && assignee.id !== requester.id) {
        const assigneeSubject = this.replaceTemplateVariables(
          template.subject,
          {
            ticket,
            user: assignee,
            comment: {
              ...comment,
              author: commenter.name,
              authorEmail: commenter.email,
            },
          }
        );
        const assigneeHtml = this.replaceTemplateVariables(template.html, {
          ticket,
          user: assignee,
          comment: {
            ...comment,
            author: commenter.name,
            authorEmail: commenter.email,
          },
        });

        await this.emailService.sendEmail(
          assignee.email,
          assigneeSubject,
          assigneeHtml,
          {}
        );
        this.logger.log(
          `Comment added email sent to assignee ${assignee.email}`
        );
      }
    } catch (error) {
      this.logger.error('Error sending comment added email:', error);
    }
  }

  // Password reset is handled by Supabase Auth directly

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
      const template = await this.prisma.emailTemplate.findFirst({
        where: { type, isActive: true },
      });

      if (!template) {
        this.logger.log(`No active email template found for type: ${type}`);
        return null;
      }

      return template;
    } catch (error) {
      this.logger.error('Error getting email template:', error);
      return null;
    }
  }

  private getDefaultTemplate(type: string) {
    const templates = {
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
      TICKET_UPDATE: {
        subject: 'Ticket Updated: {{ticket.ticketNumber}}',
        html: `
          <h2>Ticket Updated</h2>
          <p>Hello {{requester.name}},</p>
          <p>Your ticket has been updated.</p>
          <p><strong>Ticket Number:</strong> {{ticket.ticketNumber}}</p>
          <p><strong>Title:</strong> {{ticket.title}}</p>
          <p><strong>Status:</strong> {{ticket.status}}</p>
          <p>You can view your ticket at: <a href="{{ticket.url}}">{{ticket.url}}</a></p>
        `,
      },
      COMMENT_ADDED: {
        subject: 'New Comment on Ticket: {{ticket.ticketNumber}}',
        html: `
          <h2>New Comment Added</h2>
          <p>Hello {{user.name}},</p>
          <p>A new comment has been added to ticket {{ticket.ticketNumber}}.</p>
          <p><strong>Comment by:</strong> {{comment.author}}</p>
          <p><strong>Comment:</strong></p>
          <p>{{comment.content}}</p>
          <p>You can view the ticket at: <a href="{{ticket.url}}">{{ticket.url}}</a></p>
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
