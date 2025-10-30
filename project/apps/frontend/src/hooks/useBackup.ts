import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { backupApi, Backup } from '../lib/apiClient';

export function useBackups() {
  return useQuery({
    queryKey: ['backups'],
    queryFn: async () => {
      const response = await backupApi.listBackups();
      return response.data.data as Backup[];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useCreateBackup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await backupApi.createBackup();
      return response.data.data as Backup;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backups'] });
    },
  });
}

export function useRestoreBackup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (backupId: string) => {
      const response = await backupApi.restoreBackup(backupId);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backups'] });
    },
  });
}

export function useDeleteBackup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (backupId: string) => {
      await backupApi.delete(backupId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backups'] });
    },
  });
}
