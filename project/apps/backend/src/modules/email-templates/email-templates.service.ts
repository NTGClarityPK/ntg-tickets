import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateEmailTemplateDto } from './dto/create-email-template.dto';
import { UpdateEmailTemplateDto } from './dto/update-email-template.dto';
import { TenantContextService } from '../../common/tenant/tenant-context.service';

@Injectable()
export class EmailTemplatesService {
  private readonly logger = new Logger(EmailTemplatesService.name);

  constructor(
    private prisma: PrismaService,
    private tenantContext: TenantContextService
  ) {}

  async create(createEmailTemplateDto: CreateEmailTemplateDto) {
    try {
      const tenantId = this.tenantContext.requireTenantId();
      
      // If creating an active template, deactivate other templates of the same type
      if (createEmailTemplateDto.isActive === true) {
        await this.prisma.emailTemplate.updateMany({
          where: {
            tenantId,
            type: createEmailTemplateDto.type,
            isActive: true,
          },
          data: { isActive: false },
        });
      }

      const emailTemplate = await this.prisma.emailTemplate.create({
        data: {
          ...createEmailTemplateDto,
          tenantId,
        },
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
      const tenantId = this.tenantContext.requireTenantId();
      const emailTemplates = await this.prisma.emailTemplate.findMany({
        where: { tenantId },
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
      // Find the active template of this type
      const emailTemplate = await this.prisma.emailTemplate.findFirst({
        where: { 
          type,
          isActive: true,
        },
      });

      return emailTemplate;
    } catch (error) {
      this.logger.error('Error finding email template by type:', error);
      throw error;
    }
  }

  async update(id: string, updateEmailTemplateDto: UpdateEmailTemplateDto) {
    try {
      // If activating this template, deactivate other templates of the same type
      if (updateEmailTemplateDto.isActive === true) {
        const currentTemplate = await this.prisma.emailTemplate.findUnique({
          where: { id },
        });
        
        if (currentTemplate) {
          // Deactivate other templates of the same type
          await this.prisma.emailTemplate.updateMany({
            where: {
              type: currentTemplate.type,
              id: { not: id },
              isActive: true,
            },
            data: { isActive: false },
          });
        }
      }

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

  async createDefaultTemplates(tenantId?: string) {
    try {
      const defaultTemplates = [
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
                  <p>Hello {{user.name}},</p>
                  <p>Ticket <strong>{{ticket.ticketNumber}}</strong> has been assigned to <strong>{{assignee.name}}</strong>.</p>
                  
                  <div class="ticket-info">
                    <h3>Ticket Details</h3>
                    <p><strong>Ticket Number:</strong> {{ticket.ticketNumber}}</p>
                    <p><strong>Title:</strong> {{ticket.title}}</p>
                    <p><strong>Priority:</strong> {{ticket.priority}}</p>
                    <p><strong>Requester:</strong> {{requester.name}} ({{requester.email}})</p>
                    <p><strong>Assigned To:</strong> {{assignee.name}} ({{assignee.email}})</p>
                    <p><strong>Category:</strong> {{ticket.category.name}}</p>
                  </div>
                  
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
          name: 'Comment Added',
          type: 'COMMENT_ADDED',
          subject: 'New Comment Added: {{ticket.ticketNumber}}',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <title>New Comment Added</title>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
                .content { padding: 20px; }
                .ticket-info { background-color: #e9ecef; padding: 15px; border-radius: 5px; margin: 15px 0; }
                .comment-box { background-color: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin: 15px 0; border-radius: 5px; }
                .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 12px; color: #6c757d; }
                .button { display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h2>New Comment Added</h2>
                </div>
                <div class="content">
                  <p>Hello {{user.name}},</p>
                  <p>A new comment has been added to ticket <strong>{{ticket.ticketNumber}}</strong>.</p>
                  
                  <div class="ticket-info">
                    <h3>Ticket Details</h3>
                    <p><strong>Ticket Number:</strong> {{ticket.ticketNumber}}</p>
                    <p><strong>Title:</strong> {{ticket.title}}</p>
                    <p><strong>Priority:</strong> {{ticket.priority}}</p>
                    <p><strong>Status:</strong> {{ticket.status}}</p>
                  </div>
                  
                  <div class="comment-box">
                    <h3>New Comment</h3>
                    <p><strong>Comment by:</strong> {{comment.author}} ({{comment.authorEmail}})</p>
                    <p><strong>Comment:</strong></p>
                    <p>{{comment.content}}</p>
                    <p><small>Posted on: {{comment.createdAt}}</small></p>
                  </div>
                  
                  <p>You can view the full conversation and respond by clicking the button below:</p>
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
          name: 'Ticket Update',
          type: 'TICKET_UPDATE',
          subject: 'Ticket Updated: {{ticket.ticketNumber}}',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <title>Ticket Updated</title>
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
                  <h2>Ticket Updated</h2>
                </div>
                <div class="content">
                  <p>Hello {{requester.name}},</p>
                  <p>Your ticket has been updated.</p>
                  
                  <div class="ticket-info">
                    <h3>Ticket Details</h3>
                    <p><strong>Ticket Number:</strong> {{ticket.ticketNumber}}</p>
                    <p><strong>Title:</strong> {{ticket.title}}</p>
                    <p><strong>Priority:</strong> {{ticket.priority}}</p>
                    <p><strong>Status:</strong> {{ticket.status}}</p>
                    <p><strong>Category:</strong> {{ticket.category.name}}</p>
                    <p><strong>Assigned To:</strong> {{ticket.assignedTo.name}}</p>
                  </div>
                  
                  <p>You can view the updated ticket by clicking the button below:</p>
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
      ];

      // Use provided tenantId or get from context
      const resolvedTenantId = tenantId || this.tenantContext.requireTenantId();
      for (const template of defaultTemplates) {
        // Check if any template of this type already exists
        const existing = await this.prisma.emailTemplate.findFirst({
          where: { tenantId: resolvedTenantId, type: template.type },
        });

        if (!existing) {
          await this.prisma.emailTemplate.create({
            data: { ...template, tenantId: resolvedTenantId },
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

      // Return template with variables preserved (not replaced)
      // This allows users to see the actual variable placeholders in the preview
      return {
        subject: template.subject,
        html: template.html,
        template,
      };
    } catch (error) {
      this.logger.error('Error previewing email template:', error);
      throw error;
    }
  }
}
