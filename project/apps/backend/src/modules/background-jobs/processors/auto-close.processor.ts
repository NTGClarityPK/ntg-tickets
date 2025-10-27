import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { TicketsService } from '../../tickets/tickets.service';

@Processor('auto-close')
export class AutoCloseProcessor {
  private readonly logger = new Logger(AutoCloseProcessor.name);

  constructor(private readonly ticketsService: TicketsService) {}

  @Process('close-resolved-tickets')
  async handleAutoClose() {
    this.logger.log('Starting auto-close process for resolved tickets');

    try {
      await this.ticketsService.autoCloseResolvedTickets();
      this.logger.log('Auto-close process completed successfully');
    } catch (error) {
      this.logger.error('Error in auto-close process:', error);
      throw error;
    }
  }
}
