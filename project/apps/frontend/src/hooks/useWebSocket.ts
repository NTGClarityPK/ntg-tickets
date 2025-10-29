'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { io, Socket } from 'socket.io-client';
import {
  showErrorNotification,
  showInfoNotification,
  showWarningNotification,
} from '@/lib/notifications';
import { WEBSOCKET_CONFIG, API_CONFIG } from '../lib/constants';

// WebSocket event data types
export interface WebSocketEventData {
  [key: string]: unknown;
}

export interface TypingEventData {
  userId: string;
  isTyping: boolean;
}

export interface TicketEventData {
  id: string;
  ticketNumber: string;
  title: string;
  [key: string]: unknown;
}

export interface CommentEventData {
  comment: {
    id: string;
    content: string;
    userId: string;
    [key: string]: unknown;
  };
  ticket: {
    id: string;
    ticketNumber: string;
    [key: string]: unknown;
  };
}

export interface NotificationEventData {
  id: string;
  title: string;
  message: string;
  type: string;
  [key: string]: unknown;
}

export function useWebSocket() {
  const { data: session } = useSession();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!session?.accessToken) return;

    const newSocket = io(API_CONFIG.BACKEND_URL, {
      auth: {
        token: session.accessToken,
      },
      transports: [...WEBSOCKET_CONFIG.TRANSPORTS],
    });

    newSocket.on('connect', () => {
      setConnected(true);
      setError(null);

      // Clear any pending reconnection
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    });

    newSocket.on('disconnect', reason => {
      setConnected(false);

      // Show notification for disconnection
      if (reason === 'io server disconnect') {
        showWarningNotification(
          WEBSOCKET_CONFIG.NOTIFICATIONS.CONNECTION_LOST.TITLE,
          WEBSOCKET_CONFIG.NOTIFICATIONS.CONNECTION_LOST.MESSAGE
        );

        // Server disconnected, try to reconnect
        reconnectTimeoutRef.current = setTimeout(() => {
          newSocket.connect();
        }, WEBSOCKET_CONFIG.RECONNECT_DELAY);
      }
    });

    newSocket.on('connect_error', error => {
      setError('Failed to connect to server');
      setConnected(false);

      showErrorNotification(
        WEBSOCKET_CONFIG.NOTIFICATIONS.CONNECTION_ERROR.TITLE,
        WEBSOCKET_CONFIG.NOTIFICATIONS.CONNECTION_ERROR.MESSAGE
      );
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-console
      console.error('WebSocket connection error:', error);
    });

    newSocket.on('connected', data => {
      // WebSocket authentication successful
      showInfoNotification(
        WEBSOCKET_CONFIG.NOTIFICATIONS.CONNECTED.TITLE,
        WEBSOCKET_CONFIG.NOTIFICATIONS.CONNECTED.MESSAGE
      );
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-console
      console.log('WebSocket authentication successful:', data);
    });

    // Ticket events
    newSocket.on('ticket_created', (ticket: TicketEventData) => {
      showInfoNotification(
        WEBSOCKET_CONFIG.NOTIFICATIONS.TICKET_CREATED.TITLE,
        `Ticket ${ticket.ticketNumber} has been created`
      );
    });

    newSocket.on('ticket_updated', (ticket: TicketEventData) => {
      showInfoNotification(
        WEBSOCKET_CONFIG.NOTIFICATIONS.TICKET_UPDATED.TITLE,
        `Ticket ${ticket.ticketNumber} has been updated`
      );
    });

    // Ticket assigned notification removed per user request
    // newSocket.on('ticket_assigned', (ticket: TicketEventData) => {
    //   showInfoNotification(
    //     WEBSOCKET_CONFIG.NOTIFICATIONS.TICKET_ASSIGNED.TITLE,
    //     `Ticket ${ticket.ticketNumber} has been assigned to you`
    //   );
    // });

    // Comment events
    newSocket.on('comment_added', ({ comment, ticket }: CommentEventData) => {
      showInfoNotification(
        WEBSOCKET_CONFIG.NOTIFICATIONS.COMMENT_ADDED.TITLE,
        `New comment on ticket ${ticket.ticketNumber}`
      );
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-console
      console.log('Comment added:', comment);
    });

    // Notification events
    newSocket.on(
      'notification_created',
      (notification: NotificationEventData) => {
        showErrorNotification(notification.title, notification.message);
      }
    );

    // SLA events
    newSocket.on('sla_warning', (ticket: TicketEventData) => {
      showWarningNotification(
        WEBSOCKET_CONFIG.NOTIFICATIONS.SLA_WARNING.TITLE,
        `Ticket ${ticket.ticketNumber} is approaching SLA deadline`
      );
    });

    newSocket.on('sla_breach', (ticket: TicketEventData) => {
      showErrorNotification(
        WEBSOCKET_CONFIG.NOTIFICATIONS.SLA_BREACH.TITLE,
        `Ticket ${ticket.ticketNumber} has breached SLA`
      );
    });

    // Typing events
    newSocket.on('user_typing', ({ userId, isTyping }: TypingEventData) => {
      // Handle typing indicators - could be used for UI state management
      // This is typically handled by the component using the hook
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-console
      console.log(`User ${userId} is ${isTyping ? 'typing' : 'not typing'}`);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [session?.accessToken]);

  const joinTicket = (ticketId: string) => {
    if (socket && connected) {
      socket.emit('join_ticket', { ticketId });
    }
  };

  const leaveTicket = (ticketId: string) => {
    if (socket && connected) {
      socket.emit('leave_ticket', { ticketId });
    }
  };

  const sendTyping = (ticketId: string, isTyping: boolean) => {
    if (socket && connected) {
      socket.emit('typing', { ticketId, isTyping });
    }
  };

  const emit = (event: string, data: WebSocketEventData) => {
    if (socket && connected) {
      socket.emit(event, data);
    }
  };

  const on = (event: string, callback: (data: WebSocketEventData) => void) => {
    if (socket) {
      socket.on(event, callback);
    }
  };

  const off = (
    event: string,
    callback?: (data: WebSocketEventData) => void
  ) => {
    if (socket) {
      socket.off(event, callback);
    }
  };

  return {
    socket,
    connected,
    error,
    joinTicket,
    leaveTicket,
    sendTyping,
    emit,
    on,
    off,
  };
}
