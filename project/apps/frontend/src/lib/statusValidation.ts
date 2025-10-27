import { TicketStatus } from '../types/unified';

// Status transition validation rules (matching backend)
export const validStatusTransitions: Record<TicketStatus, TicketStatus[]> = {
  [TicketStatus.NEW]: [TicketStatus.OPEN, TicketStatus.CLOSED],
  [TicketStatus.OPEN]: [
    TicketStatus.IN_PROGRESS,
    TicketStatus.ON_HOLD,
    TicketStatus.CLOSED,
  ],
  [TicketStatus.IN_PROGRESS]: [
    TicketStatus.ON_HOLD,
    TicketStatus.RESOLVED,
    TicketStatus.CLOSED,
  ],
  [TicketStatus.ON_HOLD]: [TicketStatus.IN_PROGRESS, TicketStatus.CLOSED],
  [TicketStatus.RESOLVED]: [TicketStatus.CLOSED, TicketStatus.REOPENED],
  [TicketStatus.CLOSED]: [TicketStatus.REOPENED],
  [TicketStatus.REOPENED]: [
    TicketStatus.OPEN,
    TicketStatus.IN_PROGRESS,
    TicketStatus.CLOSED,
  ],
};

// Function to check if status transition is valid
export const isValidStatusTransition = (
  currentStatus: TicketStatus,
  newStatus: TicketStatus
): boolean => {
  return validStatusTransitions[currentStatus]?.includes(newStatus) || false;
};

// Function to get user-friendly error message for invalid transitions
export const getStatusTransitionErrorMessage = (
  ticketNumber: string,
  currentStatus: string,
  newStatus: string
): string => {
  return `Cannot change ticket #${ticketNumber} from "${currentStatus.replace('_', ' ')}" to "${newStatus.replace('_', ' ')}"`;
};

// Function to validate status update with resolution requirement
export const validateStatusUpdate = (
  currentStatus: TicketStatus,
  newStatus: TicketStatus,
  resolution?: string,
  userRole?: string
): { isValid: boolean; errorMessage?: string } => {
  // Check if transition is valid
  if (!isValidStatusTransition(currentStatus, newStatus)) {
    return {
      isValid: false,
      errorMessage: `Invalid status transition from "${currentStatus.replace('_', ' ')}" to "${newStatus.replace('_', ' ')}"`,
    };
  }

  // Check role-based permissions
  if (userRole === 'END_USER') {
    // End users can only reopen closed tickets
    if (
      currentStatus !== TicketStatus.CLOSED ||
      newStatus !== TicketStatus.REOPENED
    ) {
      return {
        isValid: false,
        errorMessage: 'End users can only reopen closed tickets',
      };
    }
  }

  // Check if resolution is required for RESOLVED status
  if (newStatus === TicketStatus.RESOLVED && !resolution?.trim()) {
    return {
      isValid: false,
      errorMessage: 'Resolution is required when setting status to RESOLVED',
    };
  }

  return { isValid: true };
};

// Status transition rules for display
export const statusTransitionRules = [
  'NEW → OPEN, CLOSED',
  'OPEN → IN_PROGRESS, ON_HOLD, CLOSED',
  'IN_PROGRESS → ON_HOLD, RESOLVED, CLOSED',
  'ON_HOLD → IN_PROGRESS, CLOSED',
  'RESOLVED → CLOSED, REOPENED',
  'CLOSED → REOPENED',
  'REOPENED → OPEN, IN_PROGRESS, CLOSED',
];
