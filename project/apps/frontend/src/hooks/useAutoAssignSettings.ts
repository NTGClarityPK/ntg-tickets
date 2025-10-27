import { useSystemSettings } from './useSystemSettings';
import { useAuthStore } from '../stores/useAuthStore';

export function useAutoAssignSettings() {
  const { user } = useAuthStore();
  const { data: settings } = useSystemSettings();

  // Only use system settings if user is admin, otherwise use defaults
  const isAdmin = user?.activeRole === 'ADMIN';
  const isAutoAssignEnabled = isAdmin
    ? settings?.autoAssignTickets || false
    : true;
  const autoCloseEnabled = isAdmin
    ? settings?.autoCloseResolved || false
    : false;
  const autoCloseDays = isAdmin ? settings?.autoCloseDays || 7 : 7;

  const getAutoAssignMessage = () => {
    if (isAutoAssignEnabled) {
      return 'Tickets will be automatically assigned based on priority and SLA level.';
    }
    return 'Auto-assignment is disabled. Tickets will need to be manually assigned.';
  };

  const getAutoCloseMessage = () => {
    if (autoCloseEnabled) {
      return `Resolved tickets will be automatically closed after ${autoCloseDays} days.`;
    }
    return 'Auto-close is disabled. Resolved tickets will remain open until manually closed.';
  };

  return {
    isAutoAssignEnabled,
    autoCloseEnabled,
    autoCloseDays,
    getAutoAssignMessage,
    getAutoCloseMessage,
  };
}
