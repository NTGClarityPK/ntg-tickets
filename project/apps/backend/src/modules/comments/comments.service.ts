import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { EmailNotificationService } from '../../common/email/email-notification.service';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class CommentsService {
  private readonly logger = new Logger(CommentsService.name);

  constructor(
    private prisma: PrismaService,
    private emailNotificationService: EmailNotificationService,
    private tenantContext: TenantContextService
  ) {}

  async create(
    createCommentDto: CreateCommentDto,
    userId: string,
    userRole: UserRole
  ) {
    try {
      // Filter by tenant
      const tenantId = this.tenantContext.getTenantId();
      
      // Verify ticket exists and user has access
      const ticket = await this.prisma.ticket.findFirst({
        where: { id: createCommentDto.ticketId, ...(tenantId ? { tenantId } : {}) },
        include: { requester: true, assignedTo: true },
      });

      if (!ticket) {
        throw new NotFoundException('Ticket not found');
      }

      // Check access permissions
      this.checkCommentAccess(ticket, userId, userRole);

      const comment = await this.prisma.comment.create({
        data: {
          ...createCommentDto,
          userId,
        },
        include: {
          user: true,
          ticket: {
            include: {
              requester: true,
              assignedTo: true,
            },
          },
        },
      });

      this.logger.log(`Comment created for ticket ${ticket.ticketNumber}`);

      // Send email notification for new comment
      const commenter = comment.user;
      if (commenter && ticket.requester) {
        await this.emailNotificationService.sendCommentAddedEmail(
          ticket,
          commenter,
          ticket.requester,
          ticket.assignedTo || null,
          comment
        );
      }

      return comment;
    } catch (error) {
      this.logger.error('Error creating comment:', error);
      throw error;
    }
  }

  async findAll(ticketId: string, userId: string, userRole: UserRole) {
    try {
      // Filter by tenant
      const tenantId = this.tenantContext.getTenantId();
      
      // Verify ticket exists and user has access
      const ticket = await this.prisma.ticket.findFirst({
        where: { id: ticketId, ...(tenantId ? { tenantId } : {}) },
        include: { requester: true, assignedTo: true },
      });

      if (!ticket) {
        throw new NotFoundException('Ticket not found');
      }

      this.checkCommentAccess(ticket, userId, userRole);

      const comments = await this.prisma.comment.findMany({
        where: { ticketId },
        include: { user: true },
        orderBy: { createdAt: 'asc' },
      });

      return comments;
    } catch (error) {
      this.logger.error('Error finding comments:', error);
      throw error;
    }
  }

  async findOne(id: string, userId: string, userRole: UserRole) {
    try {
      const comment = await this.prisma.comment.findUnique({
        where: { id },
        include: {
          user: true,
          ticket: {
            include: {
              requester: true,
              assignedTo: true,
            },
          },
        },
      });

      if (!comment) {
        throw new NotFoundException('Comment not found');
      }

      // Check access permissions
      this.checkCommentAccess(comment.ticket, userId, userRole);

      return comment;
    } catch (error) {
      this.logger.error('Error finding comment:', error);
      throw error;
    }
  }

  async update(
    id: string,
    updateCommentDto: UpdateCommentDto,
    userId: string,
    userRole: UserRole
  ) {
    try {
      const comment = await this.prisma.comment.findUnique({
        where: { id },
        include: {
          user: true,
          ticket: {
            include: {
              requester: true,
              assignedTo: true,
            },
          },
        },
      });

      if (!comment) {
        throw new NotFoundException('Comment not found');
      }

      // Check access permissions
      this.checkCommentAccess(comment.ticket, userId, userRole);

      // Check if user can edit this comment
      if (comment.userId !== userId && userRole !== UserRole.ADMIN) {
        throw new ForbiddenException('You can only edit your own comments');
      }

      const updatedComment = await this.prisma.comment.update({
        where: { id },
        data: {
          ...updateCommentDto,
          updatedAt: new Date(),
        },
        include: { user: true },
      });

      this.logger.log(`Comment updated: ${id}`);
      return updatedComment;
    } catch (error) {
      this.logger.error('Error updating comment:', error);
      throw error;
    }
  }

  async remove(id: string, userId: string, userRole: UserRole) {
    try {
      const comment = await this.prisma.comment.findUnique({
        where: { id },
        include: {
          user: true,
          ticket: {
            include: {
              requester: true,
              assignedTo: true,
            },
          },
        },
      });

      if (!comment) {
        throw new NotFoundException('Comment not found');
      }

      // Check access permissions
      this.checkCommentAccess(comment.ticket, userId, userRole);

      // Check if user can delete this comment
      if (comment.userId !== userId && userRole !== UserRole.ADMIN) {
        throw new ForbiddenException('You can only delete your own comments');
      }

      await this.prisma.comment.delete({
        where: { id },
      });

      this.logger.log(`Comment deleted: ${id}`);
      return { message: 'Comment deleted successfully' };
    } catch (error) {
      this.logger.error('Error deleting comment:', error);
      throw error;
    }
  }

  private checkCommentAccess(
    ticket: { requesterId: string; assignedToId?: string },
    userId: string,
    userRole: UserRole
  ) {
    if (userRole === UserRole.ADMIN || userRole === UserRole.SUPPORT_MANAGER) {
      return; // Admins and managers can access all comments
    }

    if (userRole === UserRole.SUPPORT_STAFF) {
      if (ticket.assignedToId !== userId && ticket.assignedToId !== null) {
        throw new ForbiddenException(
          'Access denied: Ticket not assigned to you'
        );
      }
      return;
    }

    if (userRole === UserRole.END_USER) {
      if (ticket.requesterId !== userId) {
        throw new ForbiddenException(
          'Access denied: You can only view comments on your own tickets'
        );
      }
    }
  }

  async findByTicketId(ticketId: string) {
    return this.prisma.comment.findMany({
      where: { ticketId },
      include: {
        user: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}
