/**
 * Shared permission utility functions
 * Provides simple role-based permission checks without API calls
 */

import { UserRole } from '../../types/unified';

/**
 * Checks if a user has a specific role
 * @param userRole - User's active role
 * @param requiredRole - Role to check against
 * @returns True if user has the required role
 */
export function hasRole(
  userRole: UserRole | string | null | undefined,
  requiredRole: UserRole | string
): boolean {
  if (!userRole) return false;
  return userRole === requiredRole;
}

/**
 * Checks if a user has any of the specified roles
 * @param userRole - User's active role
 * @param allowedRoles - Array of allowed roles
 * @returns True if user has one of the allowed roles
 */
export function hasAnyRole(
  userRole: UserRole | string | null | undefined,
  allowedRoles: (UserRole | string)[]
): boolean {
  if (!userRole || !allowedRoles.length) return false;
  return allowedRoles.includes(userRole);
}

/**
 * Checks if a user is an administrator
 * @param userRole - User's active role
 * @returns True if user is an admin
 */
export function isAdmin(userRole: UserRole | string | null | undefined): boolean {
  return hasRole(userRole, UserRole.ADMIN);
}

/**
 * Checks if a user is a support staff member (staff or manager)
 * @param userRole - User's active role
 * @returns True if user is support staff
 */
export function isSupportStaff(
  userRole: UserRole | string | null | undefined
): boolean {
  return hasAnyRole(userRole, [UserRole.SUPPORT_STAFF, UserRole.SUPPORT_MANAGER]);
}

/**
 * Checks if a user is a manager (support manager or admin)
 * @param userRole - User's active role
 * @returns True if user is a manager
 */
export function isManager(userRole: UserRole | string | null | undefined): boolean {
  return hasAnyRole(userRole, [UserRole.SUPPORT_MANAGER, UserRole.ADMIN]);
}

/**
 * Checks if a user can manage users (admin only)
 * @param userRole - User's active role
 * @returns True if user can manage users
 */
export function canManageUsers(
  userRole: UserRole | string | null | undefined
): boolean {
  return isAdmin(userRole);
}

/**
 * Checks if a user can view all tickets (not just their own)
 * @param userRole - User's active role
 * @returns True if user can view all tickets
 */
export function canViewAllTickets(
  userRole: UserRole | string | null | undefined
): boolean {
  return isSupportStaff(userRole);
}

/**
 * Checks if a user can assign tickets
 * @param userRole - User's active role
 * @returns True if user can assign tickets
 */
export function canAssignTickets(
  userRole: UserRole | string | null | undefined
): boolean {
  return isSupportStaff(userRole);
}

/**
 * Checks if a user can edit tickets
 * @param userRole - User's active role
 * @returns True if user can edit tickets
 */
export function canEditTickets(
  userRole: UserRole | string | null | undefined
): boolean {
  return isSupportStaff(userRole);
}

/**
 * Checks if a user can delete tickets
 * @param userRole - User's active role
 * @returns True if user can delete tickets
 */
export function canDeleteTickets(
  userRole: UserRole | string | null | undefined
): boolean {
  return isManager(userRole);
}

