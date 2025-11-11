import {
  WebSocketGateway as WSGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import configuration from '../../config/configuration';

const appConfig = configuration();

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

@WSGateway({
  cors: {
    origin: appConfig.cors.origins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  allowEIO3: true,
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  serveClient: false,
})
export class WebSocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebSocketGateway.name);
  private connectedUsers = new Map<string, string>(); // userId -> socketId

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService
  ) {}

  afterInit(server: Server) {
    // Handle Socket.IO connection errors
    server.engine.on('connection_error', err => {
      this.logger.warn('Socket.IO connection error:', err.message);
    });
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract token from handshake
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn('No token provided for WebSocket connection');
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = this.jwtService.verify(token);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, roles: true, name: true },
      });

      if (!user) {
        this.logger.warn('Invalid user for WebSocket connection');
        client.disconnect();
        return;
      }

      // Store user info in socket
      client.userId = user.id;
      client.userRole = payload.activeRole || user.roles[0]; // Use activeRole from JWT or first role
      this.connectedUsers.set(user.id, client.id);

      // Join user to their personal room
      client.join(`user:${user.id}`);

      // Join role-based rooms
      client.join(`role:${client.userRole}`);

      // Join admin room if user is admin
      if (
        client.userRole === 'ADMIN' ||
        client.userRole === 'SUPPORT_MANAGER'
      ) {
        client.join('admin');
      }

      this.logger.log(`User ${user.email} connected via WebSocket`);

      // Send connection confirmation
      client.emit('connected', {
        message: 'Connected successfully',
        user: {
          id: user.id,
          email: user.email,
          role: client.userRole,
          name: user.name,
        },
      });
    } catch (error) {
      this.logger.error('WebSocket connection error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.connectedUsers.delete(client.userId);
      this.logger.log(`User ${client.userId} disconnected from WebSocket`);
    }
  }

  @SubscribeMessage('join_ticket')
  handleJoinTicket(
    @MessageBody() data: { ticketId: string },
    @ConnectedSocket() client: AuthenticatedSocket
  ) {
    if (!client.userId) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    client.join(`ticket:${data.ticketId}`);
    client.emit('joined_ticket', { ticketId: data.ticketId });
  }

  @SubscribeMessage('leave_ticket')
  handleLeaveTicket(
    @MessageBody() data: { ticketId: string },
    @ConnectedSocket() client: AuthenticatedSocket
  ) {
    client.leave(`ticket:${data.ticketId}`);
    client.emit('left_ticket', { ticketId: data.ticketId });
  }

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() data: { ticketId: string; isTyping: boolean },
    @ConnectedSocket() client: AuthenticatedSocket
  ) {
    if (!client.userId) return;

    client.to(`ticket:${data.ticketId}`).emit('user_typing', {
      userId: client.userId,
      isTyping: data.isTyping,
    });
  }

  // Methods to emit events from other services
  emitTicketCreated(ticket: {
    id: string;
    ticketNumber: string;
    title: string;
    priority: string;
    status: string;
    requesterId: string;
    assignedToId?: string;
  }) {
    this.server.emit('ticket_created', ticket);

    // Notify specific user
    this.server.to(`user:${ticket.requesterId}`).emit('ticket_created', ticket);

    // Notify support staff
    this.server.to('role:SUPPORT_STAFF').emit('ticket_created', ticket);
    this.server.to('role:SUPPORT_MANAGER').emit('ticket_created', ticket);
  }

  emitTicketUpdated(
    ticket: {
      id: string;
      ticketNumber: string;
      title: string;
      priority: string;
      status: string;
      requesterId: string;
      assignedToId?: string;
    },
    userId: string
  ) {
    // Notify ticket room
    this.server.to(`ticket:${ticket.id}`).emit('ticket_updated', ticket);

    // Notify requester
    this.server.to(`user:${ticket.requesterId}`).emit('ticket_updated', ticket);

    // Notify assignee if different from updater
    if (ticket.assignedToId && ticket.assignedToId !== userId) {
      this.server
        .to(`user:${ticket.assignedToId}`)
        .emit('ticket_updated', ticket);
    }
  }

  emitTicketAssigned(ticket: {
    id: string;
    ticketNumber: string;
    title: string;
    priority: string;
    status: string;
    requesterId: string;
    assignedToId?: string;
  }) {
    // Notify assignee
    this.server
      .to(`user:${ticket.assignedToId}`)
      .emit('ticket_assigned', ticket);

    // Notify requester
    this.server
      .to(`user:${ticket.requesterId}`)
      .emit('ticket_assigned', ticket);

    // Notify support managers
    this.server.to('role:SUPPORT_MANAGER').emit('ticket_assigned', ticket);
  }

  emitCommentAdded(
    comment: { id: string; content: string; authorId: string; createdAt: Date },
    ticket: {
      id: string;
      ticketNumber: string;
      requesterId: string;
      assignedToId?: string;
    }
  ) {
    // Notify ticket room
    this.server
      .to(`ticket:${ticket.id}`)
      .emit('comment_added', { comment, ticket });

    // Notify requester if comment is not from them
    if (comment.authorId !== ticket.requesterId) {
      this.server
        .to(`user:${ticket.requesterId}`)
        .emit('comment_added', { comment, ticket });
    }

    // Notify assignee if comment is not from them and ticket is assigned
    if (ticket.assignedToId && comment.authorId !== ticket.assignedToId) {
      this.server
        .to(`user:${ticket.assignedToId}`)
        .emit('comment_added', { comment, ticket });
    }
  }

  emitNotificationCreated(notification: {
    id: string;
    userId: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
  }) {
    // Notify specific user
    this.server
      .to(`user:${notification.userId}`)
      .emit('notification_created', notification);
  }

  emitSLABreach(ticket: {
    id: string;
    ticketNumber: string;
    title: string;
    priority: string;
    status: string;
    requesterId: string;
    assignedToId?: string;
    dueDate: Date;
  }) {
    // Notify assignee
    if (ticket.assignedToId) {
      this.server.to(`user:${ticket.assignedToId}`).emit('sla_breach', ticket);
    }

    // Notify support managers and admins
    this.server.to('role:SUPPORT_MANAGER').emit('sla_breach', ticket);
    this.server.to('role:ADMIN').emit('sla_breach', ticket);
  }

  emitSLAWarning(ticket: {
    id: string;
    ticketNumber: string;
    title: string;
    priority: string;
    status: string;
    requesterId: string;
    assignedToId?: string;
    dueDate: Date;
  }) {
    // Notify assignee
    if (ticket.assignedToId) {
      this.server.to(`user:${ticket.assignedToId}`).emit('sla_warning', ticket);
    }

    // Notify support managers
    this.server.to('role:SUPPORT_MANAGER').emit('sla_warning', ticket);
  }

  // Get connected users count
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  // Check if user is connected
  isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  // Send message to specific user
  sendToUser(userId: string, event: string, data: Record<string, unknown>) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  // Send message to role
  sendToRole(role: string, event: string, data: Record<string, unknown>) {
    this.server.to(`role:${role}`).emit(event, data);
  }
}
