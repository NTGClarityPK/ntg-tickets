import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

// Define UserRole enum locally or import from types
enum UserRole {
  END_USER = 'END_USER',
  SUPPORT_STAFF = 'SUPPORT_STAFF',
  SUPPORT_MANAGER = 'SUPPORT_MANAGER',
  ADMIN = 'ADMIN',
}

@Injectable()
export class CommentsService {
  private readonly logger = new Logger(CommentsService.name);

  constructor(private supabase: SupabaseService) {}

  async create(
    createCommentDto: CreateCommentDto,
    userId: string,
    userRole: string | UserRole
  ) {
    try {
      // Verify ticket exists and user has access
      const { data: ticket, error: ticketError } = await this.supabase.client
        .from('tickets')
        .select(`
          *,
          requester:users!requester_id (*),
          assigned_to:users!assigned_to_id (*)
        `)
        .eq('id', createCommentDto.ticketId)
        .single();

      if (ticketError || !ticket) {
        throw new NotFoundException('Ticket not found');
      }

      // Check access permissions
      this.checkCommentAccess(ticket, userId, userRole);

      const { data: comment, error: commentError } = await this.supabase.client
        .from('comments')
        .insert({
          ticket_id: createCommentDto.ticketId,
          user_id: userId,
          content: createCommentDto.content,
          is_internal: createCommentDto.isInternal ?? false,
        })
        .select(`
          *,
          user:users (*),
          ticket:tickets (
            *,
            requester:users!requester_id (*),
            assigned_to:users!assigned_to_id (*)
          )
        `)
        .single();

      if (commentError) {
        this.logger.error('Error creating comment:', commentError);
        throw commentError;
      }

      this.logger.log(`Comment created for ticket ${ticket.ticket_number}`);
      return this.mapComment(comment);
    } catch (error) {
      this.logger.error('Error creating comment:', error);
      throw error;
    }
  }

  async findAll(ticketId: string, userId: string, userRole: string | UserRole) {
    try {
      // Verify ticket exists and user has access
      const { data: ticket, error: ticketError } = await this.supabase.client
        .from('tickets')
        .select(`
          *,
          requester:users!requester_id (*),
          assigned_to:users!assigned_to_id (*)
        `)
        .eq('id', ticketId)
        .single();

      if (ticketError || !ticket) {
        throw new NotFoundException('Ticket not found');
      }

      this.checkCommentAccess(ticket, userId, userRole);

      const { data: comments, error } = await this.supabase.client
        .from('comments')
        .select(`
          *,
          user:users (*)
        `)
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) {
        this.logger.error('Error finding comments:', error);
        throw error;
      }

      return (comments || []).map(this.mapComment);
    } catch (error) {
      this.logger.error('Error finding comments:', error);
      throw error;
    }
  }

  async findOne(id: string, userId: string, userRole: string | UserRole) {
    try {
      const { data: comment, error } = await this.supabase.client
        .from('comments')
        .select(`
          *,
          user:users (*),
          ticket:tickets (
            *,
            requester:users!requester_id (*),
            assigned_to:users!assigned_to_id (*)
          )
        `)
        .eq('id', id)
        .single();

      if (error || !comment) {
        throw new NotFoundException('Comment not found');
      }

      // Check access permissions
      this.checkCommentAccess(comment.ticket, userId, userRole);

      return this.mapComment(comment);
    } catch (error) {
      this.logger.error('Error finding comment:', error);
      throw error;
    }
  }

  async update(
    id: string,
    updateCommentDto: UpdateCommentDto,
    userId: string,
    userRole: string | UserRole
  ) {
    try {
      const { data: comment, error: findError } = await this.supabase.client
        .from('comments')
        .select(`
          *,
          user:users (*),
          ticket:tickets (
            *,
            requester:users!requester_id (*),
            assigned_to:users!assigned_to_id (*)
          )
        `)
        .eq('id', id)
        .single();

      if (findError || !comment) {
        throw new NotFoundException('Comment not found');
      }

      // Check access permissions
      this.checkCommentAccess(comment.ticket, userId, userRole);

      // Check if user can edit this comment
      if (comment.user_id !== userId && userRole !== UserRole.ADMIN && userRole !== 'ADMIN') {
        throw new ForbiddenException('You can only edit your own comments');
      }

      const { data: updatedComment, error: updateError } = await this.supabase.client
        .from('comments')
        .update({
          content: updateCommentDto.content,
          is_internal: updateCommentDto.isInternal,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select(`
          *,
          user:users (*)
        `)
        .single();

      if (updateError) {
        this.logger.error('Error updating comment:', updateError);
        throw updateError;
      }

      this.logger.log(`Comment updated: ${id}`);
      return this.mapComment(updatedComment);
    } catch (error) {
      this.logger.error('Error updating comment:', error);
      throw error;
    }
  }

  async remove(id: string, userId: string, userRole: string | UserRole) {
    try {
      const { data: comment, error: findError } = await this.supabase.client
        .from('comments')
        .select(`
          *,
          user:users (*),
          ticket:tickets (
            *,
            requester:users!requester_id (*),
            assigned_to:users!assigned_to_id (*)
          )
        `)
        .eq('id', id)
        .single();

      if (findError || !comment) {
        throw new NotFoundException('Comment not found');
      }

      // Check access permissions
      this.checkCommentAccess(comment.ticket, userId, userRole);

      // Check if user can delete this comment
      if (comment.user_id !== userId && userRole !== UserRole.ADMIN && userRole !== 'ADMIN') {
        throw new ForbiddenException('You can only delete your own comments');
      }

      const { error: deleteError } = await this.supabase.client
        .from('comments')
        .delete()
        .eq('id', id);

      if (deleteError) {
        this.logger.error('Error deleting comment:', deleteError);
        throw deleteError;
      }

      this.logger.log(`Comment deleted: ${id}`);
      return { message: 'Comment deleted successfully' };
    } catch (error) {
      this.logger.error('Error deleting comment:', error);
      throw error;
    }
  }

  private checkCommentAccess(
    ticket: { requester_id: string; assigned_to_id?: string | null },
    userId: string,
    userRole: string | UserRole
  ) {
    const role = typeof userRole === 'string' ? userRole : userRole;
    
    if (role === UserRole.ADMIN || role === 'ADMIN' || 
        role === UserRole.SUPPORT_MANAGER || role === 'SUPPORT_MANAGER') {
      return; // Admins and managers can access all comments
    }

    if (role === UserRole.SUPPORT_STAFF || role === 'SUPPORT_STAFF') {
      if (ticket.assigned_to_id !== userId && ticket.assigned_to_id !== null) {
        throw new ForbiddenException(
          'Access denied: Ticket not assigned to you'
        );
      }
      return;
    }

    if (role === UserRole.END_USER || role === 'END_USER') {
      if (ticket.requester_id !== userId) {
        throw new ForbiddenException(
          'Access denied: You can only view comments on your own tickets'
        );
      }
    }
  }

  async findByTicketId(ticketId: string) {
    const { data: comments, error } = await this.supabase.client
      .from('comments')
      .select(`
        *,
        user:users (*)
      `)
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (error) {
      this.logger.error('Error finding comments by ticket:', error);
      throw error;
    }

    return (comments || []).map(this.mapComment);
  }

  /**
   * Map Supabase snake_case to camelCase for API compatibility
   */
  private mapComment(comment: any) {
    return {
      id: comment.id,
      ticketId: comment.ticket_id,
      userId: comment.user_id,
      content: comment.content,
      isInternal: comment.is_internal,
      createdAt: comment.created_at,
      updatedAt: comment.updated_at,
      user: comment.user ? this.mapUser(comment.user) : comment.user,
      ticket: comment.ticket ? this.mapTicket(comment.ticket) : comment.ticket,
    };
  }

  /**
   * Map user from snake_case to camelCase
   */
  private mapUser(user: any) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles,
      isActive: user.is_active,
      avatar: user.avatar,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };
  }

  /**
   * Map ticket from snake_case to camelCase
   */
  private mapTicket(ticket: any) {
    return {
      id: ticket.id,
      ticketNumber: ticket.ticket_number,
      title: ticket.title,
      description: ticket.description,
      categoryId: ticket.category_id,
      subcategoryId: ticket.subcategory_id,
      priority: ticket.priority,
      status: ticket.status,
      impact: ticket.impact,
      urgency: ticket.urgency,
      slaLevel: ticket.sla_level,
      requesterId: ticket.requester_id,
      assignedToId: ticket.assigned_to_id,
      dueDate: ticket.due_date,
      resolution: ticket.resolution,
      createdAt: ticket.created_at,
      updatedAt: ticket.updated_at,
      closedAt: ticket.closed_at,
      requester: ticket.requester ? this.mapUser(ticket.requester) : ticket.requester,
      assignedTo: ticket.assigned_to ? this.mapUser(ticket.assigned_to) : ticket.assigned_to,
    };
  }
}
