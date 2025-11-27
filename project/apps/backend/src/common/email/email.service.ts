import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';

// Define proper types for email data
interface EmailData {
  [key: string]: string | number | Date | undefined;
}

interface TicketWithRelations {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  createdAt: Date;
  dueDate?: Date;
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

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private fromEmail: string;
  private fromName: string;
  private frontendUrl: string;

  constructor() {
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@ntg-ticket.com';
    this.fromName = process.env.FROM_NAME || 'NTG Ticket';
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  }

  async onModuleInit() {
    this.logger.log('EmailService initializing...');
    await this.initializeTransporter();
  }

  private async initializeTransporter() {
    try {
      // Read directly from process.env as fallback
      const host = process.env.SMTP_HOST || '';
      const port = parseInt(process.env.SMTP_PORT || '587', 10);
      const user = process.env.SMTP_USER || '';
      const pass = process.env.SMTP_PASS || '';
      
      this.logger.log(`SMTP config: host=${host}, port=${port}, user=${user ? '***' : 'empty'}`);

      if (!host || !user) {
        this.logger.warn('SMTP not configured in env. Email functionality will be disabled.');
        this.transporter = null;
        return;
      }

      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: false,
        auth: {
          user,
          pass,
        },
      });

      await this.transporter.verify();
      this.logger.log('Email transporter initialized successfully');
    } catch (error) {
      this.logger.warn('Email transporter not available:', error.message);
      this.transporter = null;
    }
  }

  async refreshTransporter() {
    await this.initializeTransporter();
  }

  async sendEmail(
    to: string,
    subject: string,
    template: string,
    data: EmailData
  ) {
    if (!this.transporter) {
      this.logger.warn(`Email not sent to ${to} - transporter not configured`);
      return;
    }

    try {
      const compiledTemplate = handlebars.compile(template);
      const html = compiledTemplate(data);

      const mailOptions = {
        from: `${this.fromName} <${this.fromEmail}>`,
        to,
        subject,
        html,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent to ${to}`);
    } catch (error) {
      this.logger.error('Error sending email:', error);
      throw error;
    }
  }

  async sendTicketCreatedEmail(ticket: TicketWithRelations, user: User) {
    const template = `
      <h2>Ticket Created Successfully</h2>
      <p>Hello {{userName}},</p>
      <p>Your ticket <strong>{{ticketNumber}}</strong> has been created successfully.</p>
      <p><strong>Title:</strong> {{title}}</p>
      <p><strong>Status:</strong> {{status}}</p>
      <p><strong>Priority:</strong> {{priority}}</p>
      <p>You can track your ticket at: <a href="{{ticketUrl}}">{{ticketUrl}}</a></p>
    `;

    await this.sendEmail(
      user.email,
      `Ticket Created: ${ticket.ticketNumber}`,
      template,
      {
        userName: user.name,
        ticketNumber: ticket.ticketNumber,
        title: ticket.title,
        status: ticket.status,
        priority: ticket.priority,
        ticketUrl: `${this.frontendUrl}/tickets/${ticket.id}`,
      }
    );
  }

  async sendTicketAssignedEmail(ticket: TicketWithRelations, assignee: User) {
    const template = `
      <h2>New Ticket Assignment</h2>
      <p>Hello {{assigneeName}},</p>
      <p>You have been assigned a new ticket <strong>{{ticketNumber}}</strong>.</p>
      <p><strong>Title:</strong> {{title}}</p>
      <p><strong>Priority:</strong> {{priority}}</p>
      <p><strong>Due Date:</strong> {{dueDate}}</p>
      <p>Please review and start working on this ticket: <a href="{{ticketUrl}}">{{ticketUrl}}</a></p>
    `;

    await this.sendEmail(
      assignee.email,
      `New Assignment: ${ticket.ticketNumber}`,
      template,
      {
        assigneeName: assignee.name,
        ticketNumber: ticket.ticketNumber,
        title: ticket.title,
        priority: ticket.priority,
        dueDate: ticket.dueDate,
        ticketUrl: `${this.frontendUrl}/tickets/${ticket.id}`,
      }
    );
  }

  async sendTicketStatusChangedEmail(ticket: TicketWithRelations, user: User) {
    const template = `
      <h2>Ticket Status Updated</h2>
      <p>Hello {{userName}},</p>
      <p>Your ticket <strong>{{ticketNumber}}</strong> status has been updated to <strong>{{status}}</strong>.</p>
      <p><strong>Title:</strong> {{title}}</p>
      <p>View the updated ticket: <a href="{{ticketUrl}}">{{ticketUrl}}</a></p>
    `;

    await this.sendEmail(
      user.email,
      `Status Update: ${ticket.ticketNumber}`,
      template,
      {
        userName: user.name,
        ticketNumber: ticket.ticketNumber,
        title: ticket.title,
        status: ticket.status,
        ticketUrl: `${this.frontendUrl}/tickets/${ticket.id}`,
      }
    );
  }

  async sendInvitationEmail(data: {
    to: string;
    inviteeName: string;
    organizationName: string;
    inviterName: string;
    roles: string[];
    inviteLink: string;
    expiresAt: string;
  }) {
    const template = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invitation to Join {{organizationName}}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
          .button:hover { background: #5a67d8; }
          .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
          .roles { display: inline-block; background: #e0e7ff; color: #4338ca; padding: 4px 12px; border-radius: 20px; font-size: 14px; margin: 2px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>You're Invited!</h1>
          <p>Join {{organizationName}} on NTG Tickets</p>
        </div>
        <div class="content">
          <p>Hi {{inviteeName}},</p>
          <p><strong>{{inviterName}}</strong> has invited you to join <strong>{{organizationName}}</strong> on NTG Tickets.</p>
          
          <div class="info-box">
            <p><strong>Your Role(s):</strong></p>
            <p>{{roles}}</p>
          </div>
          
          <p>Click the button below to set up your account:</p>
          <p style="text-align: center;">
            <a href="{{inviteLink}}" class="button">Accept Invitation</a>
          </p>
          
          <p style="color: #6b7280; font-size: 14px;">
            <strong>Note:</strong> This invitation expires on {{expiresAt}}. 
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="{{inviteLink}}">{{inviteLink}}</a>
          </p>
        </div>
        <div class="footer">
          <p>This is an automated message from NTG Tickets.</p>
          <p>If you didn't expect this invitation, you can safely ignore this email.</p>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail(
      data.to,
      `You're invited to join ${data.organizationName} on NTG Tickets`,
      template,
      {
        inviteeName: data.inviteeName,
        organizationName: data.organizationName,
        inviterName: data.inviterName,
        roles: data.roles.join(', '),
        inviteLink: data.inviteLink,
        expiresAt: new Date(data.expiresAt).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
      }
    );
  }
}
