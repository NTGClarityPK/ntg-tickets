import { TicketImpact, TicketPriority } from '@prisma/client';

/**
 * Calculates ticket priority based on impact
 * @param impact - The impact level of the ticket
 * @returns The calculated priority level
 */
export function calculatePriority(
  impact: TicketImpact
): TicketPriority {
  // Priority based on impact only
  const priorityMap: Record<TicketImpact, TicketPriority> = {
    [TicketImpact.MINOR]: TicketPriority.LOW,
    [TicketImpact.MODERATE]: TicketPriority.MEDIUM,
    [TicketImpact.MAJOR]: TicketPriority.HIGH,
    [TicketImpact.CRITICAL]: TicketPriority.CRITICAL,
  };

  return priorityMap[impact];
}

/**
 * Calculates SLA level based on priority and impact
 * @param priority - The priority level of the ticket
 * @param impact - The impact level of the ticket
 * @returns The calculated SLA level
 */
export function calculateSlaLevel(
  priority: TicketPriority,
  impact: TicketImpact
): 'STANDARD' | 'PREMIUM' | 'CRITICAL_SUPPORT' {
  // Critical priority or critical impact gets critical support
  if (
    priority === TicketPriority.CRITICAL ||
    impact === TicketImpact.CRITICAL
  ) {
    return 'CRITICAL_SUPPORT';
  }

  // High priority or major impact gets premium support
  if (priority === TicketPriority.HIGH || impact === TicketImpact.MAJOR) {
    return 'PREMIUM';
  }

  // Everything else gets standard support
  return 'STANDARD';
}

/**
 * Calculates due date based on SLA level and creation time
 * @param slaLevel - The SLA level of the ticket
 * @param createdAt - The creation time of the ticket
 * @returns The calculated due date
 */
export function calculateDueDate(
  slaLevel: 'STANDARD' | 'PREMIUM' | 'CRITICAL_SUPPORT',
  createdAt: Date
): Date {
  // const now = new Date();
  // const businessHoursPerDay = 8; // 9 AM to 5 PM
  // const workingDaysPerWeek = 5; // Monday to Friday

  let businessHoursToAdd: number;

  switch (slaLevel) {
    case 'CRITICAL_SUPPORT':
      businessHoursToAdd = 4; // 4 business hours
      break;
    case 'PREMIUM':
      businessHoursToAdd = 16; // 2 business days
      break;
    case 'STANDARD':
    default:
      businessHoursToAdd = 40; // 5 business days
      break;
  }

  // Calculate due date considering business hours only
  const dueDate = new Date(createdAt);
  let hoursAdded = 0;

  while (hoursAdded < businessHoursToAdd) {
    dueDate.setHours(dueDate.getHours() + 1);

    // Check if it's a business day (Monday = 1, Friday = 5)
    const dayOfWeek = dueDate.getDay();
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      // Check if it's within business hours (9 AM to 5 PM)
      const hour = dueDate.getHours();
      if (hour >= 9 && hour < 17) {
        hoursAdded++;
      }
    }
  }

  return dueDate;
}

/**
 * Determines if a ticket is approaching SLA breach
 * @param dueDate - The due date of the ticket
 * @param slaLevel - The SLA level of the ticket
 * @returns Object indicating if ticket is approaching breach and time remaining
 */
export function checkSlaStatus(
  dueDate: Date,
  slaLevel: 'STANDARD' | 'PREMIUM' | 'CRITICAL_SUPPORT'
): {
  isApproachingBreach: boolean;
  isBreached: boolean;
  timeRemaining: number; // in hours
  status: 'green' | 'yellow' | 'red';
} {
  const now = new Date();
  const timeDiff = dueDate.getTime() - now.getTime();
  const hoursRemaining = Math.ceil(timeDiff / (1000 * 60 * 60));

  let warningThreshold: number;
  let criticalThreshold: number;

  switch (slaLevel) {
    case 'CRITICAL_SUPPORT':
      warningThreshold = 2; // 2 hours warning
      criticalThreshold = 1; // 1 hour critical
      break;
    case 'PREMIUM':
      warningThreshold = 8; // 8 hours warning
      criticalThreshold = 2; // 2 hours critical
      break;
    case 'STANDARD':
    default:
      warningThreshold = 24; // 24 hours warning
      criticalThreshold = 4; // 4 hours critical
      break;
  }

  const isBreached = hoursRemaining <= 0;
  const isApproachingBreach = hoursRemaining <= warningThreshold;
  const isCritical = hoursRemaining <= criticalThreshold;

  let status: 'green' | 'yellow' | 'red';
  if (isBreached) {
    status = 'red';
  } else if (isCritical) {
    status = 'red';
  } else if (isApproachingBreach) {
    status = 'yellow';
  } else {
    status = 'green';
  }

  return {
    isApproachingBreach,
    isBreached,
    timeRemaining: Math.max(0, hoursRemaining),
    status,
  };
}

/**
 * Auto-assigns ticket based on priority and SLA level
 * @param priority - The priority level of the ticket
 * @param slaLevel - The SLA level of the ticket
 * @param availableStaff - Array of available support staff
 * @returns The ID of the assigned staff member or null if no assignment
 */
export function autoAssignTicket(
  priority: TicketPriority,
  slaLevel: 'STANDARD' | 'PREMIUM' | 'CRITICAL_SUPPORT',
  availableStaff: Array<{ id: string; roles: string[]; workload: number }>
): string | null {
  if (availableStaff.length === 0) return null;

  // Filter staff based on SLA level requirements
  let eligibleStaff = availableStaff;

  if (slaLevel === 'CRITICAL_SUPPORT') {
    // Only managers and senior staff for critical support
    eligibleStaff = availableStaff.filter(
      staff =>
        staff.roles.includes('SUPPORT_MANAGER') || staff.roles.includes('ADMIN')
    );
  } else if (slaLevel === 'PREMIUM') {
    // Managers and experienced staff for premium support
    eligibleStaff = availableStaff.filter(staff =>
      staff.roles.some(role =>
        ['SUPPORT_MANAGER', 'ADMIN', 'SUPPORT_STAFF'].includes(role)
      )
    );
  }

  if (eligibleStaff.length === 0) {
    // Fallback to any available staff
    eligibleStaff = availableStaff;
  }

  // Sort by workload (ascending) to balance load
  eligibleStaff.sort((a, b) => a.workload - b.workload);

  // For critical priority, prefer managers
  if (priority === TicketPriority.CRITICAL) {
    const managers = eligibleStaff.filter(
      staff =>
        staff.roles.includes('SUPPORT_MANAGER') || staff.roles.includes('ADMIN')
    );
    if (managers.length > 0) {
      return managers[0].id;
    }
  }

  return eligibleStaff[0].id;
}
