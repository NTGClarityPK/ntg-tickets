/**
 * Shared SLA (Service Level Agreement) utility functions
 * Centralizes SLA-related calculations and checks
 */

import { Ticket, TicketStatus } from '../../types/unified';
import { getHoursDifference, isPastDate } from './date.utils';

/**
 * Checks if a ticket is overdue (past due date and not resolved/closed)
 * @param ticket - Ticket object
 * @returns True if ticket is overdue
 */
export function isTicketOverdue(ticket: {
  dueDate?: string | Date | null;
  status: TicketStatus | string;
}): boolean {
  if (!ticket.dueDate) return false;
  
  // Tickets that are resolved or closed are not considered overdue
  if (['RESOLVED', 'CLOSED'].includes(ticket.status)) return false;
  
  return isPastDate(ticket.dueDate);
}

/**
 * Checks if a ticket has breached SLA (closed after due date)
 * @param ticket - Ticket object
 * @returns True if ticket breached SLA
 */
export function hasTicketBreachedSLA(ticket: {
  dueDate?: string | Date | null;
  closedAt?: string | Date | null;
  status: TicketStatus | string;
}): boolean {
  if (!ticket.dueDate || !ticket.closedAt) return false;
  
  // Only closed/resolved tickets can breach SLA
  if (!['RESOLVED', 'CLOSED'].includes(ticket.status)) return false;
  
  const closedDate = typeof ticket.closedAt === 'string' 
    ? new Date(ticket.closedAt) 
    : ticket.closedAt;
  const dueDate = typeof ticket.dueDate === 'string' 
    ? new Date(ticket.dueDate) 
    : ticket.dueDate;
  
  return closedDate > dueDate;
}

/**
 * Calculates how many hours a ticket breached SLA by
 * @param ticket - Ticket object
 * @returns Hours breached (0 if not breached)
 */
export function getSlaBreachHours(ticket: {
  dueDate?: string | Date | null;
  closedAt?: string | Date | null;
  status: TicketStatus | string;
}): number {
  if (!hasTicketBreachedSLA(ticket) || !ticket.dueDate || !ticket.closedAt) {
    return 0;
  }
  
  return getHoursDifference(ticket.closedAt, ticket.dueDate);
}

/**
 * Calculates resolution time in hours for a closed ticket
 * @param ticket - Ticket object
 * @returns Resolution time in hours (0 if not closed)
 */
export function getResolutionTimeHours(ticket: {
  createdAt: string | Date;
  closedAt?: string | Date | null;
  status: TicketStatus | string;
}): number {
  if (!ticket.closedAt || !['RESOLVED', 'CLOSED'].includes(ticket.status)) {
    return 0;
  }
  
  return getHoursDifference(ticket.closedAt, ticket.createdAt);
}

/**
 * Filters tickets that are overdue
 * @param tickets - Array of tickets
 * @returns Array of overdue tickets
 */
export function filterOverdueTickets<T extends Ticket>(tickets: T[]): T[] {
  return tickets.filter(ticket => isTicketOverdue(ticket));
}

/**
 * Filters tickets that have breached SLA
 * @param tickets - Array of tickets
 * @returns Array of tickets that breached SLA
 */
export function filterSlaBreachedTickets<T extends Ticket>(tickets: T[]): T[] {
  return tickets.filter(ticket => hasTicketBreachedSLA(ticket));
}

/**
 * Calculates SLA compliance percentage for a set of tickets
 * @param tickets - Array of tickets
 * @returns Percentage of tickets that met SLA (0-100)
 */
export function calculateSlaCompliance<T extends Ticket>(tickets: T[]): number {
  if (tickets.length === 0) return 100;
  
  const closedTickets = tickets.filter(ticket =>
    ['RESOLVED', 'CLOSED'].includes(ticket.status)
  );
  
  if (closedTickets.length === 0) return 100;
  
  const compliantTickets = closedTickets.filter(
    ticket => !hasTicketBreachedSLA(ticket)
  );
  
  return Math.round((compliantTickets.length / closedTickets.length) * 100);
}

/**
 * Gets the time remaining until due date in hours
 * @param ticket - Ticket object
 * @returns Hours remaining (negative if overdue)
 */
export function getTimeRemainingHours(ticket: {
  dueDate?: string | Date | null;
}): number {
  if (!ticket.dueDate) return 0;
  
  const dueDate = typeof ticket.dueDate === 'string' 
    ? new Date(ticket.dueDate) 
    : ticket.dueDate;
  const now = new Date();
  
  const diffInMs = dueDate.getTime() - now.getTime();
  return diffInMs / (1000 * 60 * 60);
}

