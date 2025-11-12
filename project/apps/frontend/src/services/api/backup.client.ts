import { httpClient } from './http-client';
import { ApiResponse, Backup } from '../../types/unified';

export const backupClient = {
  createBackup: () => httpClient.post<ApiResponse<Backup>>('/backup/create'),

  listBackups: () => httpClient.get<ApiResponse<Backup[]>>('/backup/list'),

  restoreBackup: (backupId: string) =>
    httpClient.post<ApiResponse<{ message: string }>>('/backup/restore', null, {
      params: { backupId },
    }),

  delete: (backupId: string) =>
    httpClient.delete<ApiResponse<{ message: string }>>('/backup/delete', {
      params: { backupId },
    }),
};


