import { UserRole } from '../types/unified';
import { getEarthyColor } from './colorConfig';

export const roleConfig = {
  [UserRole.END_USER]: {
    color: getEarthyColor('light'),
    label: 'End User',
    icon: 'IconUser',
  },
  [UserRole.SUPPORT_STAFF]: {
    color: getEarthyColor('neutral'),
    label: 'Support Staff',
    icon: 'IconUsers',
  },
  [UserRole.SUPPORT_MANAGER]: {
    color: getEarthyColor('warm'),
    label: 'Support Manager',
    icon: 'IconShield',
  },
  [UserRole.ADMIN]: {
    color: getEarthyColor('darkest'),
    label: 'Administrator',
    icon: 'IconSettings',
  },
} as const;

export const getRoleColor = (role: UserRole): string => {
  return roleConfig[role]?.color || 'gray';
};

export const getRoleLabel = (role: UserRole): string => {
  return roleConfig[role]?.label || 'Unknown';
};
