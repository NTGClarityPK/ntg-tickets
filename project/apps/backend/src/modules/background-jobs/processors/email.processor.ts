import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { EmailService } from '../../../common/email/email.service';

@Processor('email')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private emailService: EmailService) {}

  @Process('send-email')
  async handleSendEmail(job: Job) {
    try {
      const { to, subject, html, templateType, data } = job.data;

      this.logger.log(`Processing email job ${job.id} for ${to}`);

      if (templateType && data) {
        // Use template-based email
        await this.emailService.sendEmail(to, subject, templateType, data);
      } else {
        // Use direct email
        await this.emailService.sendEmail(to, subject, html, {});
      }

      this.logger.log(`Email job ${job.id} completed successfully`);
    } catch (error) {
      this.logger.error(`Email job ${job.id} failed:`, error);
      throw error;
    }
  }
}
