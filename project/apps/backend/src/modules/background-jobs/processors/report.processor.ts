import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { ReportsService } from '../../reports/reports.service';
import { EmailService } from '../../../common/email/email.service';

@Processor('reports')
export class ReportProcessor {
  private readonly logger = new Logger(ReportProcessor.name);

  constructor(
    private reportsService: ReportsService,
    private emailService: EmailService
  ) {}

  @Process('generate-report')
  async handleGenerateReport(job: Job) {
    try {
      const { userId, reportType, parameters, emailTo } = job.data;

      this.logger.log(`Processing report job ${job.id} for user ${userId}`);

      // Generate the report
      const report = await this.reportsService.generateReport({
        userId,
        reportType,
        parameters,
      });

      // If email is requested, send the report
      if (emailTo) {
        await this.emailService.sendEmail(
          emailTo,
          `Report: ${reportType}`,
          `Please find attached the ${reportType} report.`,
          { filePath: report.filePath }
        );
      }

      this.logger.log(`Report job ${job.id} completed successfully`);
    } catch (error) {
      this.logger.error(`Report job ${job.id} failed:`, error);
      throw error;
    }
  }

  @Process('daily-reports')
  async handleDailyReports(job: Job) {
    try {
      this.logger.log(`Processing daily reports job ${job.id}`);

      // Generate daily reports for all managers and admins
      const dailyReport = await this.reportsService.generateDailyReport();

      // Send to all managers and admins
      const recipients = await this.reportsService.getReportRecipients();

      for (const recipient of recipients) {
        await this.emailService.sendEmail(
          recipient.email,
          'Daily System Report',
          'Please find attached the daily system report.',
          { filePath: dailyReport.filePath }
        );
      }

      this.logger.log(`Daily reports job ${job.id} completed successfully`);
    } catch (error) {
      this.logger.error(`Daily reports job ${job.id} failed:`, error);
      throw error;
    }
  }
}
