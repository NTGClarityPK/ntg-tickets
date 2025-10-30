import { UserRole } from '../types/unified';

/**
 * Gets role configuration with dynamic theme colors
 * This function should be called with the current theme colors from useDynamicTheme hook
 */
export const getRoleConfig = (themeColors: {
  primaryLighter: string;
  primaryDark: string;
  primaryDarker: string;
  primaryDarkest: string;
}) => ({
  [UserRole.END_USER]: {
    color: themeColors.primaryLighter,  // Lighter tone for end users
    label: 'End User',
    icon: 'IconUser',
  },
  [UserRole.SUPPORT_STAFF]: {
    color: themeColors.primaryDark,  // Dark tone for good visibility
    label: 'Support Staff',
    icon: 'IconUsers',
  },
  [UserRole.SUPPORT_MANAGER]: {
    color: themeColors.primaryDarker,  // Darker tone - uses theme color, no yellow!
    label: 'Support Manager',
    icon: 'IconShield',
  },
  [UserRole.ADMIN]: {
    color: themeColors.primaryDarkest,  // Darkest tone for admins
    label: 'Administrator',
    icon: 'IconSettings',
  },
} as const);

/**
 * Gets role color based on dynamic theme colors
 * @param role - The user role
 * @param themeColors - Current theme colors from useDynamicTheme hook
 */
export const getRoleColor = (role: UserRole, themeColors: {
  primaryLighter: string;
  primaryDark: string;
  primaryDarker: string;
  primaryDarkest: string;
}): string => {
  const config = getRoleConfig(themeColors);
  return config[role]?.color || 'gray';
};

/**
 * Gets role label (static, doesn't depend on theme)
 */
export const getRoleLabel = (role: UserRole): string => {
  const labels = {
    [UserRole.END_USER]: 'End User',
    [UserRole.SUPPORT_STAFF]: 'Support Staff',
    [UserRole.SUPPORT_MANAGER]: 'Support Manager',
    [UserRole.ADMIN]: 'Administrator',
  };
  return labels[role] || 'Unknown';
};
