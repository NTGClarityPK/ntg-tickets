import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SystemConfigService } from '../config/system-config.service';
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
  private transporter: nodemailer.Transporter;

  constructor(
    private configService: ConfigService,
    private systemConfigService: SystemConfigService
  ) {}

  async onModuleInit() {
    await this.initializeTransporter();
  }

  private async initializeTransporter() {
    try {
      const emailConfig = this.systemConfigService.getEmailConfig();

      this.transporter = nodemailer.createTransport({
        host: emailConfig.host,
        port: emailConfig.port,
        secure: false,
        auth: {
          user: emailConfig.username,
          pass: emailConfig.password,
        },
      });

      // Verify connection
      await this.transporter.verify();
      this.logger.log('Email transporter initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize email transporter:', error);
      // Fallback to environment variables
      this.transporter = nodemailer.createTransport({
        host: this.configService.get('SMTP_HOST'),
        port: this.configService.get('SMTP_PORT'),
        secure: false,
        auth: {
          user: this.configService.get('SMTP_USER'),
          pass: this.configService.get('SMTP_PASS'),
        },
      });
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
    try {
      const compiledTemplate = handlebars.compile(template);
      const html = compiledTemplate(data);

      const emailConfig = this.systemConfigService.getEmailConfig();

      const mailOptions = {
        from: `${emailConfig.fromName} <${emailConfig.fromEmail}>`,
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
        ticketUrl: `${process.env.FRONTEND_URL}/tickets/${ticket.id}`,
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
        ticketUrl: `${process.env.FRONTEND_URL}/tickets/${ticket.id}`,
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
        ticketUrl: `${process.env.FRONTEND_URL}/tickets/${ticket.id}`,
      }
    );
  }
}
