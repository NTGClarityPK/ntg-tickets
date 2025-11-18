import { useState, useCallback } from 'react';
import {
  showSuccessNotification,
  showErrorNotification,
  showWarningNotification,
} from '@/lib/notifications';
import { notifications } from '@mantine/notifications';
import { useQueryClient } from '@tanstack/react-query';
import { ticketApi, notificationsApi } from '../lib/apiClient';
import { BulkUpdateData, TicketPriority } from '../types/unified';
import { useDynamicTheme } from './useDynamicTheme';

export const useBulkOperations = () => {
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();
  const { primaryLight } = useDynamicTheme();

  const selectTicket = useCallback((ticketId: string) => {
    setSelectedTickets(prev => [...prev, ticketId]);
  }, []);

  const deselectTicket = useCallback((ticketId: string) => {
    setSelectedTickets(prev => prev.filter(id => id !== ticketId));
  }, []);

  const toggleTicket = useCallback((ticketId: string) => {
    setSelectedTickets(prev =>
      prev.includes(ticketId)
        ? prev.filter(id => id !== ticketId)
        : [...prev, ticketId]
    );
  }, []);

  const selectAll = useCallback((ticketIds: string[]) => {
    setSelectedTickets(ticketIds);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedTickets([]);
  }, []);

  const isSelected = useCallback(
    (ticketId: string) => {
      return selectedTickets.includes(ticketId);
    },
    [selectedTickets]
  );

  const isAllSelected = useCallback(
    (ticketIds: string[]) => {
      return (
        ticketIds.length > 0 &&
        ticketIds.every(id => selectedTickets.includes(id))
      );
    },
    [selectedTickets]
  );

  const isIndeterminate = useCallback(
    (ticketIds: string[]) => {
      const selectedCount = ticketIds.filter(id =>
        selectedTickets.includes(id)
      ).length;
      return selectedCount > 0 && selectedCount < ticketIds.length;
    },
    [selectedTickets]
  );

  const bulkUpdate = useCallback(
    async (action: string, data: BulkUpdateData) => {
      if (selectedTickets.length === 0) return;

      setIsProcessing(true);

      try {
        let successful = 0;
        let failed = 0;

        // Handle bulk delete separately with a single API call
        if (action === 'delete') {
          try {
            const result = await ticketApi.bulkDeleteTickets(selectedTickets);
            successful = result.data.data.deletedCount || selectedTickets.length;
            failed = selectedTickets.length - successful;
            
            // Note: Elasticsearch errors are logged on the backend
            // We can show a warning if some deletions failed
            if (failed > 0) {
              showWarningNotification(
                'Partial Deletion',
                `${successful} tickets deleted, but ${failed} could not be deleted`
              );
            }
          } catch (error) {
            failed = selectedTickets.length;
            throw error;
          }
        } else {
          // Handle other bulk operations with individual API calls
          const promises = selectedTickets.map(ticketId => {
            switch (action) {
              case 'status':
                return ticketApi.updateStatus(
                  ticketId,
                  (data as { status: string; resolution?: string }).status,
                  (data as { status: string; resolution?: string }).resolution
                );

              case 'assign':
                return ticketApi.assignTicket(
                  ticketId,
                  (data as { assignedToId: string }).assignedToId
                );

              case 'priority':
                return ticketApi.updateTicket(ticketId, {
                  priority: (data as { priority: TicketPriority }).priority,
                });

              case 'notify':
                return notificationsApi.sendBulkNotification(
                  selectedTickets,
                  (data as { message: string }).message
                );

              default:
                throw new Error(`Unknown bulk action: ${action}`);
            }
          });

          const results = await Promise.allSettled(promises);
          successful = results.filter(
            result => result.status === 'fulfilled'
          ).length;
          failed = results.filter(
            result => result.status === 'rejected'
          ).length;
        }

        if (action === 'delete') {
          // For delete, we already handled notifications above
          if (successful > 0 && failed === 0) {
            notifications.show({
              title: 'Bulk Delete Successful',
              message: `Successfully deleted ${successful} ticket(s)`,
              color: primaryLight,
            });
          }
        } else {
          // For other operations, show standard notifications
          if (successful > 0) {
            showSuccessNotification(
              'Bulk Operation Successful',
              `${successful} tickets updated successfully`
            );
          }

          if (failed > 0) {
            showWarningNotification(
              'Some Operations Failed',
              `${failed} tickets could not be updated`
            );
          }
        }

        // Invalidate queries to refresh the ticket list
        if (successful > 0) {
          queryClient.invalidateQueries({ queryKey: ['tickets'] });
          queryClient.invalidateQueries({
            queryKey: ['tickets-with-pagination'],
          });
          queryClient.invalidateQueries({ queryKey: ['all-tickets-counting'] });
          queryClient.invalidateQueries({ queryKey: ['total-tickets-count'] });
          queryClient.invalidateQueries({ queryKey: ['my-tickets'] });

          // Invalidate individual ticket queries for updated tickets
          selectedTickets.forEach(ticketId => {
            queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
          });
        }

        // Clear selection after successful operations
        if (action !== 'notify') {
          clearSelection();
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        showErrorNotification(
          'Bulk Operation Failed',
          'An error occurred while processing the bulk operation: ' +
            errorMessage
        );
      } finally {
        setIsProcessing(false);
      }
    },
    [selectedTickets, clearSelection, queryClient, primaryLight]
  );

  return {
    selectedTickets,
    isProcessing,
    selectTicket,
    deselectTicket,
    toggleTicket,
    selectAll,
    clearSelection,
    isSelected,
    isAllSelected,
    isIndeterminate,
    bulkUpdate,
  };
};
