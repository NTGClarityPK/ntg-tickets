import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateEmailTemplateDto } from './dto/create-email-template.dto';
import { UpdateEmailTemplateDto } from './dto/update-email-template.dto';

@Injectable()
export class EmailTemplatesService {
  private readonly logger = new Logger(EmailTemplatesService.name);

  constructor(private prisma: PrismaService) {}

  async create(createEmailTemplateDto: CreateEmailTemplateDto) {
    try {
      const emailTemplate = await this.prisma.emailTemplate.create({
        data: createEmailTemplateDto,
      });

      this.logger.log(`Email template created: ${emailTemplate.name}`);
      return emailTemplate;
    } catch (error) {
      this.logger.error('Error creating email template:', error);
      throw error;
    }
  }

  async findAll() {
    try {
      const emailTemplates = await this.prisma.emailTemplate.findMany({
        orderBy: { name: 'asc' },
      });

      return emailTemplates;
    } catch (error) {
      this.logger.error('Error finding email templates:', error);
      throw error;
    }
  }

  async findOne(id: string) {
    try {
      const emailTemplate = await this.prisma.emailTemplate.findUnique({
        where: { id },
      });

      if (!emailTemplate) {
        throw new NotFoundException('Email template not found');
      }

      return emailTemplate;
    } catch (error) {
      this.logger.error('Error finding email template:', error);
      throw error;
    }
  }

  async findByType(type: string) {
    try {
      const emailTemplate = await this.prisma.emailTemplate.findUnique({
        where: { type },
      });

      return emailTemplate;
    } catch (error) {
      this.logger.error('Error finding email template by type:', error);
      throw error;
    }
  }

  async update(id: string, updateEmailTemplateDto: UpdateEmailTemplateDto) {
    try {
      const emailTemplate = await this.prisma.emailTemplate.update({
        where: { id },
        data: updateEmailTemplateDto,
      });

      this.logger.log(`Email template updated: ${emailTemplate.name}`);
      return emailTemplate;
    } catch (error) {
      this.logger.error('Error updating email template:', error);
      throw error;
    }
  }

  async remove(id: string) {
    try {
      const emailTemplate = await this.prisma.emailTemplate.delete({
        where: { id },
      });

      this.logger.log(`Email template deleted: ${emailTemplate.name}`);
      return { message: 'Email template deleted successfully' };
    } catch (error) {
      this.logger.error('Error deleting email template:', error);
      throw error;
    }
  }

  async createDefaultTemplates() {
    try {
      const defaultTemplates = [
        {
          name: 'Ticket Created',
          type: 'TICKET_CREATED',
          subject: 'Ticket Created: {{ticket.ticketNumber}}',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <title>Ticket Created</title>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
                .content { padding: 20px; }
                .ticket-info { background-color: #e9ecef; padding: 15px; border-radius: 5px; margin: 15px 0; }
                .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 12px; color: #6c757d; }
                .button { display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h2>Ticket Created Successfully</h2>
                </div>
                <div class="content">
                  <p>Hello {{user.name}},</p>
                  <p>Your ticket has been created successfully and is being reviewed by our support team.</p>
                  
                  <div class="ticket-info">
                    <h3>Ticket Details</h3>
                    <p><strong>Ticket Number:</strong> {{ticket.ticketNumber}}</p>
                    <p><strong>Title:</strong> {{ticket.title}}</p>
                    <p><strong>Priority:</strong> {{ticket.priority}}</p>
                    <p><strong>Status:</strong> {{ticket.status}}</p>
                    <p><strong>Category:</strong> {{ticket.category}}</p>
                    <p><strong>Created:</strong> {{ticket.createdAt}}</p>
                  </div>
                  
                  <p>You can track the progress of your ticket by clicking the button below:</p>
                  <p><a href="{{ticket.url}}" class="button">View Ticket</a></p>
                  
                  <p>If you have any questions, please don't hesitate to contact our support team.</p>
                </div>
                <div class="footer">
                  <p>This is an automated message from the NTG Ticket.</p>
                </div>
              </div>
            </body>
            </html>
        `,
          isActive: true,
        },
        {
          name: 'Ticket Assigned',
          type: 'TICKET_ASSIGNED',
          subject: 'Ticket Assigned: {{ticket.ticketNumber}}',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <title>Ticket Assigned</title>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
                .content { padding: 20px; }
                .ticket-info { background-color: #e9ecef; padding: 15px; border-radius: 5px; margin: 15px 0; }
                .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 12px; color: #6c757d; }
                .button { display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
          <h2>Ticket Assigned</h2>
                </div>
                <div class="content">
                  <p>Hello {{assignee.name}},</p>
                  <p>A new ticket has been assigned to you for resolution.</p>
                  
                  <div class="ticket-info">
                    <h3>Ticket Details</h3>
                    <p><strong>Ticket Number:</strong> {{ticket.ticketNumber}}</p>
                    <p><strong>Title:</strong> {{ticket.title}}</p>
                    <p><strong>Priority:</strong> {{ticket.priority}}</p>
                    <p><strong>Requester:</strong> {{requester.name}} ({{requester.email}})</p>
                    <p><strong>Category:</strong> {{ticket.category}}</p>
                    <p><strong>Due Date:</strong> {{ticket.dueDate}}</p>
                  </div>
                  
                  <p>Please review the ticket and begin working on it as soon as possible.</p>
                  <p><a href="{{ticket.url}}" class="button">View Ticket</a></p>
                </div>
                <div class="footer">
                  <p>This is an automated message from the NTG Ticket.</p>
                </div>
              </div>
            </body>
            </html>
        `,
          isActive: true,
        },
        {
          name: 'Ticket Status Changed',
          type: 'TICKET_STATUS_CHANGED',
          subject: 'Ticket Status Updated: {{ticket.ticketNumber}}',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <title>Ticket Status Updated</title>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
                .content { padding: 20px; }
                .ticket-info { background-color: #e9ecef; padding: 15px; border-radius: 5px; margin: 15px 0; }
                .status-change { background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #28a745; }
                .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 12px; color: #6c757d; }
                .button { display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
          <h2>Ticket Status Updated</h2>
                </div>
                <div class="content">
                  <p>Hello {{user.name}},</p>
                  <p>The status of your ticket has been updated.</p>
                  
                  <div class="status-change">
                    <h3>Status Change</h3>
                    <p><strong>Previous Status:</strong> {{oldStatus}}</p>
          <p><strong>New Status:</strong> {{newStatus}}</p>
                  </div>
                  
                  <div class="ticket-info">
                    <h3>Ticket Details</h3>
                    <p><strong>Ticket Number:</strong> {{ticket.ticketNumber}}</p>
                    <p><strong>Title:</strong> {{ticket.title}}</p>
                    <p><strong>Priority:</strong> {{ticket.priority}}</p>
                    <p><strong>Updated:</strong> {{ticket.updatedAt}}</p>
                  </div>
                  
                  <p>You can view the updated ticket by clicking the button below:</p>
                  <p><a href="{{ticket.url}}" class="button">View Ticket</a></p>
                </div>
                <div class="footer">
                  <p>This is an automated message from the NTG Ticket.</p>
                </div>
          </div>
            </body>
            </html>
        `,
          isActive: true,
        },
        {
          name: 'SLA Warning',
          type: 'SLA_WARNING',
          subject: 'SLA Warning: {{ticket.ticketNumber}}',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <title>SLA Warning</title>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #fff3cd; padding: 20px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #ffc107; }
                .content { padding: 20px; }
                .ticket-info { background-color: #e9ecef; padding: 15px; border-radius: 5px; margin: 15px 0; }
                .warning { background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #ffc107; }
                .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 12px; color: #6c757d; }
                .button { display: inline-block; padding: 10px 20px; background-color: #ffc107; color: #212529; text-decoration: none; border-radius: 5px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h2>⚠️ SLA Warning</h2>
                </div>
                <div class="content">
                  <p>Hello {{user.name}},</p>
                  
                  <div class="warning">
                    <h3>⚠️ SLA Deadline Approaching</h3>
                    <p>This is a warning that ticket <strong>{{ticket.ticketNumber}}</strong> is approaching its SLA deadline.</p>
                  </div>
                  
                  <div class="ticket-info">
                    <h3>Ticket Details</h3>
                    <p><strong>Ticket Number:</strong> {{ticket.ticketNumber}}</p>
                    <p><strong>Title:</strong> {{ticket.title}}</p>
                    <p><strong>Priority:</strong> {{ticket.priority}}</p>
                    <p><strong>Due Date:</strong> {{ticket.dueDate}}</p>
                    <p><strong>Current Status:</strong> {{ticket.status}}</p>
                  </div>
                  
                  <p><strong>Action Required:</strong> Please take immediate action to resolve this ticket before the deadline.</p>
                  <p><a href="{{ticket.url}}" class="button">View Ticket</a></p>
                </div>
                <div class="footer">
                  <p>This is an automated message from the NTG Ticket.</p>
                </div>
              </div>
            </body>
            </html>
        `,
          isActive: true,
        },
        {
          name: 'SLA Breach',
          type: 'SLA_BREACH',
          subject: '🚨 SLA Breach: {{ticket.ticketNumber}}',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <title>SLA Breach</title>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #f8d7da; padding: 20px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #dc3545; }
                .content { padding: 20px; }
                .ticket-info { background-color: #e9ecef; padding: 15px; border-radius: 5px; margin: 15px 0; }
                .breach { background-color: #f8d7da; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #dc3545; }
                .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 12px; color: #6c757d; }
                .button { display: inline-block; padding: 10px 20px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 5px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h2>🚨 SLA Breach Alert</h2>
                </div>
                <div class="content">
                  <p>Hello {{user.name}},</p>
                  
                  <div class="breach">
                    <h3>🚨 SLA Deadline Breached</h3>
                    <p>Ticket <strong>{{ticket.ticketNumber}}</strong> has breached its SLA deadline and requires immediate attention.</p>
                  </div>
                  
                  <div class="ticket-info">
                    <h3>Ticket Details</h3>
                    <p><strong>Ticket Number:</strong> {{ticket.ticketNumber}}</p>
                    <p><strong>Title:</strong> {{ticket.title}}</p>
                    <p><strong>Priority:</strong> {{ticket.priority}}</p>
                    <p><strong>Due Date:</strong> {{ticket.dueDate}}</p>
                    <p><strong>Current Status:</strong> {{ticket.status}}</p>
                    <p><strong>Days Overdue:</strong> {{daysOverdue}}</p>
                  </div>
                  
                  <p><strong>URGENT ACTION REQUIRED:</strong> This ticket must be resolved immediately. Please escalate if necessary.</p>
                  <p><a href="{{ticket.url}}" class="button">View Ticket</a></p>
                </div>
                <div class="footer">
                  <p>This is an automated message from the NTG Ticket.</p>
                </div>
              </div>
            </body>
            </html>
        `,
          isActive: true,
        },
      ];

      for (const template of defaultTemplates) {
        const existing = await this.prisma.emailTemplate.findUnique({
          where: { type: template.type },
        });

        if (!existing) {
          await this.prisma.emailTemplate.create({
            data: template,
          });
        }
      }

      this.logger.log('Default email templates created/verified');
    } catch (error) {
      this.logger.error('Error creating default email templates:', error);
      throw error;
    }
  }

  async previewTemplate(
    id: string,
    variables: {
      user?: { name?: string; email?: string };
      ticket?: {
        ticketNumber?: string;
        title?: string;
        priority?: string;
        status?: string;
        category?: string;
        createdAt?: Date;
        updatedAt?: Date;
        dueDate?: Date;
        url?: string;
      };
      assignee?: { name?: string; email?: string };
      requester?: { name?: string; email?: string };
      comment?: { content?: string; author?: string };
      oldStatus?: string;
      newStatus?: string;
      daysOverdue?: string;
    }
  ) {
    try {
      const template = await this.findOne(id);

      // Replace template variables with sample data
      let html = template.html;
      let subject = template.subject;

      // Replace common variables
      const replacements = {
        '{{user.name}}': variables.user?.name || 'John Doe',
        '{{user.email}}': variables.user?.email || 'john.doe@example.com',
        '{{ticket.ticketNumber}}':
          variables.ticket?.ticketNumber || 'TKT-2024-000001',
        '{{ticket.title}}': variables.ticket?.title || 'Sample Ticket Title',
        '{{ticket.priority}}': variables.ticket?.priority || 'MEDIUM',
        '{{ticket.status}}': variables.ticket?.status || 'NEW',
        '{{ticket.category}}': variables.ticket?.category || 'SOFTWARE',
        '{{ticket.createdAt}}':
          variables.ticket?.createdAt?.toLocaleDateString() ||
          new Date().toLocaleDateString(),
        '{{ticket.updatedAt}}':
          variables.ticket?.updatedAt?.toLocaleDateString() ||
          new Date().toLocaleDateString(),
        '{{ticket.dueDate}}':
          variables.ticket?.dueDate?.toLocaleDateString() ||
          new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString(),
        '{{ticket.url}}':
          variables.ticket?.url ||
          'https://tickets.example.com/tickets/TKT-2024-000001',
        '{{assignee.name}}': variables.assignee?.name || 'Jane Smith',
        '{{assignee.email}}':
          variables.assignee?.email || 'jane.smith@example.com',
        '{{requester.name}}': variables.requester?.name || 'John Doe',
        '{{requester.email}}':
          variables.requester?.email || 'john.doe@example.com',
        '{{oldStatus}}': variables.oldStatus || 'NEW',
        '{{newStatus}}': variables.newStatus || 'IN_PROGRESS',
        '{{daysOverdue}}': variables.daysOverdue || '2',
      };

      for (const [placeholder, value] of Object.entries(replacements)) {
        html = html.replace(new RegExp(placeholder, 'g'), String(value));
        subject = subject.replace(new RegExp(placeholder, 'g'), String(value));
      }

      return {
        subject,
        html,
        template,
      };
    } catch (error) {
      this.logger.error('Error previewing email template:', error);
      throw error;
    }
  }
}
