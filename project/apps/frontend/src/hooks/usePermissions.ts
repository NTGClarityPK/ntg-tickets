import { useState, useEffect, useCallback } from 'react';
import apiClient from '../lib/apiClient';

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  conditions?: Record<string, unknown>;
}

export interface RolePermission {
  role: string;
  permissions: Permission[];
}

export interface PermissionCheck {
  hasPermission: boolean;
  message: string;
}

export function usePermissions() {
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllRolePermissions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/permissions/all');
      setRolePermissions(response.data.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch role permissions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllRolePermissions();
  }, [fetchAllRolePermissions]);

  const getRolePermissions = async (role: string) => {
    try {
      const response = await apiClient.get(`/permissions/role/${role}`);
      return response.data.data;
    } catch (err) {
      setError('Failed to fetch role permissions');
      throw err;
    }
  };

  const checkPermission = async (
    resource: string,
    action: string,
    context?: Record<string, unknown>
  ): Promise<PermissionCheck> => {
    try {
      const response = await apiClient.get(
        `/permissions/check/${resource}/${action}`,
        {
          data: context,
        }
      );
      return response.data.data;
    } catch (err) {
      setError('Failed to check permission');
      throw err;
    }
  };

  const checkTicketAccess = async (
    ticketId: string,
    action: string
  ): Promise<PermissionCheck> => {
    try {
      const response = await apiClient.post(
        `/permissions/ticket/${ticketId}/${action}`
      );
      return response.data.data;
    } catch (err) {
      setError('Failed to check ticket access');
      throw err;
    }
  };

  const checkUserAccess = async (
    userId: string,
    action: string
  ): Promise<PermissionCheck> => {
    try {
      const response = await apiClient.post(
        `/permissions/user/${userId}/${action}`
      );
      return response.data.data;
    } catch (err) {
      setError('Failed to check user access');
      throw err;
    }
  };

  return {
    rolePermissions,
    loading,
    error,
    fetchAllRolePermissions,
    getRolePermissions,
    checkPermission,
    checkTicketAccess,
    checkUserAccess,
  };
}

export function usePermissionCheck() {
  const [permissionCache, setPermissionCache] = useState<
    Record<string, boolean>
  >({});

  const checkPermission = async (
    resource: string,
    action: string,
    context?: Record<string, unknown>
  ): Promise<boolean> => {
    const cacheKey = `${resource}:${action}:${JSON.stringify(context || {})}`;

    if (permissionCache[cacheKey] !== undefined) {
      return permissionCache[cacheKey];
    }

    try {
      const response = await apiClient.get(
        `/permissions/check/${resource}/${action}`,
        {
          data: context,
        }
      );
      const hasPermission = response.data.data.hasPermission;
      setPermissionCache(prev => ({ ...prev, [cacheKey]: hasPermission }));
      return hasPermission;
    } catch (err) {
      return false;
    }
  };

  const checkTicketAccess = async (
    ticketId: string,
    action: string
  ): Promise<boolean> => {
    const cacheKey = `ticket:${ticketId}:${action}`;

    if (permissionCache[cacheKey] !== undefined) {
      return permissionCache[cacheKey];
    }

    try {
      const response = await apiClient.post(
        `/permissions/ticket/${ticketId}/${action}`
      );
      const canAccess = response.data.data.canAccess;
      setPermissionCache(prev => ({ ...prev, [cacheKey]: canAccess }));
      return canAccess;
    } catch (err) {
      return false;
    }
  };

  const checkUserAccess = async (
    userId: string,
    action: string
  ): Promise<boolean> => {
    const cacheKey = `user:${userId}:${action}`;

    if (permissionCache[cacheKey] !== undefined) {
      return permissionCache[cacheKey];
    }

    try {
      const response = await apiClient.post(
        `/permissions/user/${userId}/${action}`
      );
      const canAccess = response.data.data.canAccess;
      setPermissionCache(prev => ({ ...prev, [cacheKey]: canAccess }));
      return canAccess;
    } catch (err) {
      return false;
    }
  };

  const clearCache = () => {
    setPermissionCache({});
  };

  return {
    checkPermission,
    checkTicketAccess,
    checkUserAccess,
    clearCache,
  };
}
