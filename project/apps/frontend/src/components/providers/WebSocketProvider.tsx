'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useNotificationsStore } from '../../stores/useNotificationsStore';
import { useTicketsStore } from '../../stores/useTicketsStore';
import { notifications as mantineNotifications } from '@mantine/notifications';
import { Notification } from '../../types/notification';
import { Ticket, Comment } from '../../types/unified';
import { useSession } from 'next-auth/react';
import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '@/lib/constants';
import { useDynamicTheme } from '../../hooks/useDynamicTheme';

interface WebSocketProviderProps {
  children: React.ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const { primaryLight, primaryDark } = useDynamicTheme();
  const socketRef = useRef<Socket | null>(null);
  const { user, isAuthenticated } = useAuthStore();
  const {
    addNotification,
    updateNotification,
    notifications,
    removeNotification,
  } = useNotificationsStore();
  const { updateTicket, addTicket } = useTicketsStore();
  const { data: session } = useSession();

  useEffect(() => {
    if (isAuthenticated && user && user.id && session?.accessToken) {
      const wsUrl = API_CONFIG.WS_URL;

      // Create Socket.IO connection
      const socket = io(wsUrl, {
        auth: {
          token: session.accessToken,
        },
        transports: ['websocket'],
      });

      socket.on('connect', () => {
        // WebSocket connected
      });

      socket.on('connected', () => {
        // WebSocket authenticated
      });

      socket.on('notification_created', (notification: Notification) => {
        // Check if notification already exists to avoid duplicates
        const existingNotification = notifications.find(
          n => n.id === notification.id
        );
        if (existingNotification) {
          // Update existing notification
          updateNotification(notification.id, notification);
        } else {
          // Add new notification
          addNotification(notification);
        }
      });

      socket.on('notification_updated', (notification: Notification) => {
        // Update existing notification
        updateNotification(notification.id, notification);
      });

      socket.on('notification_deleted', (notificationId: string) => {
        // Remove notification from store
        removeNotification(notificationId);
      });

      socket.on('ticket_updated', (ticket: Ticket) => {
        updateTicket(ticket.id, ticket);
      });

      socket.on('ticket_created', (ticket: Ticket) => {
        // Add new ticket to store
        addTicket(ticket);
      });

      socket.on(
        'comment_added',
        (data: {
          comment: Comment;
          ticket: { id: string; ticketNumber: string };
        }) => {
          // Get current ticket from store to append the new comment
          const { tickets } = useTicketsStore.getState();
          const currentTicket = tickets.find(t => t.id === data.ticket.id);

          if (currentTicket) {
            // Update the ticket to reflect the new comment
            updateTicket(data.ticket.id, {
              comments: [...(currentTicket.comments || []), data.comment],
              updatedAt: new Date().toISOString(),
            });
          }

          // Show notification for new comment
          mantineNotifications.show({
            title: 'New Comment',
            message: `A new comment was added to ticket ${data.ticket.ticketNumber}`,
            color: primaryDark,
          });
        }
      );

      socket.on(
        'sla_breach',
        (data: { ticketId: string; ticketTitle: string }) => {
          // Show critical notification for SLA breach
          mantineNotifications.show({
            title: 'SLA Breach Alert',
            message: `SLA has been breached for ticket: ${data.ticketTitle}`,
            color: primaryDark,
            autoClose: false, // Don't auto-close critical alerts
          });

          // Create notification in store
          addNotification({
            id: `sla-breach-${data.ticketId}-${Date.now()}`,
            userId: user?.id || '',
            ticketId: data.ticketId,
            type: 'SLA_BREACH',
            title: 'SLA Breach Alert',
            message: `SLA has been breached for ticket: ${data.ticketTitle}`,
            isRead: false,
            createdAt: new Date(),
          });
        }
      );

      socket.on(
        'sla_warning',
        (data: {
          ticketId: string;
          ticketTitle: string;
          timeRemaining: string;
        }) => {
          // Show warning notification for SLA approaching
          mantineNotifications.show({
            title: 'SLA Warning',
            message: `SLA approaching for ticket: ${data.ticketTitle}. Time remaining: ${data.timeRemaining}`,
            color: 'orange',
          });

          // Create notification in store
          addNotification({
            id: `sla-warning-${data.ticketId}-${Date.now()}`,
            userId: user?.id || '',
            ticketId: data.ticketId,
            type: 'SLA_WARNING',
            title: 'SLA Warning',
            message: `SLA approaching for ticket: ${data.ticketTitle}. Time remaining: ${data.timeRemaining}`,
            isRead: false,
            createdAt: new Date(),
          });
        }
      );

      // Additional ticket-related events
      // Ticket assigned notification removed per user request
      // socket.on(
      //   'ticket_assigned',
      //   (data: {
      //     ticketId: string;
      //     ticketTitle: string;
      //     assigneeName: string;
      //   }) => {
      //     mantineNotifications.show({
      //       title: 'Ticket Assigned',
      //       message: `Ticket "${data.ticketTitle}" has been assigned to ${data.assigneeName}`,
      //       color: 'red',
      //     });

      //     addNotification({
      //       id: `ticket-assigned-${data.ticketId}-${Date.now()}`,
      //       userId: user?.id || '',
      //       ticketId: data.ticketId,
      //       type: 'TICKET_ASSIGNED',
      //       title: 'Ticket Assigned',
      //       message: `Ticket "${data.ticketTitle}" has been assigned to ${data.assigneeName}`,
      //       isRead: false,
      //       createdAt: new Date(),
      //     });
      //   }
      // );

      socket.on(
        'ticket_status_changed',
        (data: {
          ticketId: string;
          ticketTitle: string;
          oldStatus: string;
          newStatus: string;
        }) => {
          mantineNotifications.show({
            title: 'Status Updated',
            message: `Ticket "${data.ticketTitle}" status changed from ${data.oldStatus} to ${data.newStatus}`,
            color: primaryLight,
          });

          addNotification({
            id: `status-changed-${data.ticketId}-${Date.now()}`,
            userId: user?.id || '',
            ticketId: data.ticketId,
            type: 'TICKET_STATUS_CHANGED',
            title: 'Status Updated',
            message: `Ticket "${data.ticketTitle}" status changed from ${data.oldStatus} to ${data.newStatus}`,
            isRead: false,
            createdAt: new Date(),
          });
        }
      );

      socketRef.current = socket;

      return () => {
        socket.disconnect();
      };
    } else {
      // Close WebSocket if user is not authenticated
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    }
  }, [
    isAuthenticated,
    user,
    addNotification,
    updateNotification,
    removeNotification,
    notifications,
    updateTicket,
    addTicket,
    session?.accessToken,
    primaryDark,
    primaryLight,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  return <>{children}</>;
}
