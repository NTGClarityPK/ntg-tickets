import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface BusinessHours {
  start: number; // Hour in 24h format (0-23)
  end: number; // Hour in 24h format (0-23)
  days: number[]; // Days of week (0 = Sunday, 1 = Monday, etc.)
}

export interface Holiday {
  date: Date;
  name: string;
  isWorkingDay: boolean;
}

@Injectable()
export class SLAService {
  private readonly logger = new Logger(SLAService.name);

  private readonly businessHours: BusinessHours = {
    start: 9, // 9 AM
    end: 17, // 5 PM
    days: [1, 2, 3, 4, 5], // Monday to Friday
  };

  private readonly holidays: Holiday[] = [
    // Add common holidays - this should be configurable in production
    { date: new Date(2024, 0, 1), name: "New Year's Day", isWorkingDay: false },
    {
      date: new Date(2024, 6, 4),
      name: 'Independence Day',
      isWorkingDay: false,
    },
    {
      date: new Date(2024, 11, 25),
      name: 'Christmas Day',
      isWorkingDay: false,
    },
  ];

  constructor(private prisma: PrismaService) {}

  /**
   * Calculate due date based on SLA level and priority
   */
  calculateDueDate(
    slaLevel: string,
    priority: string,
    startDate: Date = new Date()
  ): Date {
    let businessHoursToAdd = 0;

    // Base hours by SLA level
    switch (slaLevel) {
      case 'STANDARD':
        businessHoursToAdd = 40; // 5 business days
        break;
      case 'PREMIUM':
        businessHoursToAdd = 16; // 2 business days
        break;
      case 'CRITICAL_SUPPORT':
        businessHoursToAdd = 4; // 4 hours
        break;
      default:
        businessHoursToAdd = 40;
    }

    // Adjust by priority
    switch (priority) {
      case 'CRITICAL':
        businessHoursToAdd = Math.min(businessHoursToAdd, 4);
        break;
      case 'HIGH':
        businessHoursToAdd = Math.min(businessHoursToAdd, 8);
        break;
      case 'MEDIUM':
        // No adjustment
        break;
      case 'LOW':
        businessHoursToAdd = Math.max(businessHoursToAdd, 40);
        break;
    }

    return this.addBusinessHours(startDate, businessHoursToAdd);
  }

  /**
   * Add business hours to a date, skipping weekends and holidays
   */
  private addBusinessHours(startDate: Date, businessHoursToAdd: number): Date {
    let currentDate = new Date(startDate);
    let hoursAdded = 0;

    // If we start outside business hours, move to next business day start
    if (!this.isWithinBusinessHours(currentDate)) {
      currentDate = this.getNextBusinessDayStart(currentDate);
    }

    while (hoursAdded < businessHoursToAdd) {
      const endOfBusinessDay = this.getEndOfBusinessDay(currentDate);
      const hoursRemainingInDay =
        (endOfBusinessDay.getTime() - currentDate.getTime()) / (1000 * 60 * 60);
      const hoursToAddToday = Math.min(
        hoursRemainingInDay,
        businessHoursToAdd - hoursAdded
      );

      currentDate = new Date(
        currentDate.getTime() + hoursToAddToday * 60 * 60 * 1000
      );
      hoursAdded += hoursToAddToday;

      // If we've reached the end of business day, move to next business day
      if (hoursAdded < businessHoursToAdd) {
        currentDate = this.getNextBusinessDayStart(currentDate);
      }
    }

    return currentDate;
  }

  /**
   * Check if a date is within business hours
   */
  private isWithinBusinessHours(date: Date): boolean {
    const dayOfWeek = date.getDay();
    const hour = date.getHours();

    // Check if it's a working day
    if (!this.businessHours.days.includes(dayOfWeek)) {
      return false;
    }

    // Check if it's a holiday
    if (this.isHoliday(date)) {
      return false;
    }

    // Check if it's within business hours
    return hour >= this.businessHours.start && hour < this.businessHours.end;
  }

  /**
   * Check if a date is a holiday
   */
  private isHoliday(date: Date): boolean {
    return this.holidays.some(
      holiday =>
        holiday.date.getFullYear() === date.getFullYear() &&
        holiday.date.getMonth() === date.getMonth() &&
        holiday.date.getDate() === date.getDate() &&
        !holiday.isWorkingDay
    );
  }

  /**
   * Get the start of the next business day
   */
  private getNextBusinessDayStart(date: Date): Date {
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    nextDay.setHours(this.businessHours.start, 0, 0, 0);

    while (!this.isWithinBusinessHours(nextDay)) {
      nextDay.setDate(nextDay.getDate() + 1);
    }

    return nextDay;
  }

  /**
   * Get the end of the current business day
   */
  private getEndOfBusinessDay(date: Date): Date {
    const endOfDay = new Date(date);
    endOfDay.setHours(this.businessHours.end, 0, 0, 0);
    return endOfDay;
  }

  /**
   * Calculate response time SLA based on SLA level
   */
  calculateResponseTimeSLA(slaLevel: string): number {
    switch (slaLevel) {
      case 'STANDARD':
        return 8; // 8 business hours
      case 'PREMIUM':
        return 4; // 4 business hours
      case 'CRITICAL_SUPPORT':
        return 1; // 1 hour (immediate response)
      default:
        return 8;
    }
  }

  /**
   * Check if a ticket is overdue
   */
  isOverdue(ticket: { dueDate: Date | null; status: string }): boolean {
    if (!ticket.dueDate || ['RESOLVED', 'CLOSED'].includes(ticket.status)) {
      return false;
    }

    return new Date() > ticket.dueDate;
  }

  /**
   * Get SLA compliance percentage
   */
  async getSLACompliance(
    tickets: Array<{ status: string; dueDate?: Date; closedAt?: Date }>
  ): Promise<number> {
    const resolvedTickets = tickets.filter(
      t => ['RESOLVED', 'CLOSED'].includes(t.status) && t.dueDate && t.closedAt
    );

    if (resolvedTickets.length === 0) return 100;

    const compliantTickets = resolvedTickets.filter(
      ticket => new Date(ticket.closedAt) <= new Date(ticket.dueDate)
    );

    return Math.round((compliantTickets.length / resolvedTickets.length) * 100);
  }

  /**
   * Get tickets approaching SLA breach (within 2 hours of due date)
   */
  async getTicketsApproachingSLA(): Promise<
    Array<{
      id: string;
      ticketNumber: string;
      title: string;
      dueDate: Date;
      status: string;
      priority: string;
      requesterId: string;
      assignedToId?: string;
    }>
  > {
    const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000);

    return this.prisma.ticket.findMany({
      where: {
        dueDate: {
          lte: twoHoursFromNow,
          gte: new Date(),
        },
        status: {
          notIn: ['RESOLVED', 'CLOSED'],
        },
      },
      include: {
        requester: true,
        assignedTo: true,
        category: true,
      },
    });
  }

  /**
   * Get tickets that have breached SLA
   */
  async getBreachedSLATickets(): Promise<
    Array<{
      id: string;
      ticketNumber: string;
      title: string;
      dueDate: Date;
      status: string;
      priority: string;
      requesterId: string;
      assignedToId?: string;
    }>
  > {
    return this.prisma.ticket.findMany({
      where: {
        dueDate: {
          lt: new Date(),
        },
        status: {
          notIn: ['RESOLVED', 'CLOSED'],
        },
      },
      include: {
        requester: true,
        assignedTo: true,
        category: true,
      },
    });
  }
}
