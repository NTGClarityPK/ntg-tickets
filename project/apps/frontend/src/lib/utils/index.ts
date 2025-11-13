/**
 * Shared utilities index
 * Central export point for all utility functions
 */

// Date utilities
export {
  formatDate,
  formatShortDate,
  formatDateTime,
  formatRelativeTime,
  isPastDate,
  isFutureDate,
  getHoursDifference,
} from './date.utils';

// Permission utilities
export {
  hasRole,
  hasAnyRole,
  isAdmin,
  isSupportStaff,
  isManager,
  canManageUsers,
  canViewAllTickets,
  canAssignTickets,
  canEditTickets,
  canDeleteTickets,
} from './permissions.utils';

// SLA utilities
export {
  isTicketOverdue,
  hasTicketBreachedSLA,
  getSlaBreachHours,
  getResolutionTimeHours,
  filterOverdueTickets,
  filterSlaBreachedTickets,
  calculateSlaCompliance,
  getTimeRemainingHours,
} from './sla.utils';

