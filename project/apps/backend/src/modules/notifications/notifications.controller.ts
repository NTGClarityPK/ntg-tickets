import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(SupabaseAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiResponse({
    status: 200,
    description: 'Notifications retrieved successfully',
  })
  async findAll(
    @Request() req,
    @Query() params: { page?: number; limit?: number; unreadOnly?: boolean }
  ) {
    const result = await this.notificationsService.findAll(req.user.id, params);
    return {
      data: result.data,
      pagination: result.pagination,
      message: 'Notifications retrieved successfully',
    };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  async markAsRead(@Param('id') id: string, @Request() req) {
    const result = await this.notificationsService.markAsRead(id, req.user.id);
    return result;
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  async markAllAsRead(@Request() req) {
    const result = await this.notificationsService.markAllAsRead(req.user.id);
    return result;
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Send bulk notifications to ticket requesters' })
  @ApiResponse({
    status: 200,
    description: 'Bulk notifications sent successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            sent: { type: 'number' },
            failed: { type: 'number' },
          },
        },
        message: { type: 'string' },
      },
    },
  })
  async sendBulkNotification(
    @Body() body: { ticketIds: string[]; message: string }
  ) {
    const result = await this.notificationsService.sendBulkNotification(
      body.ticketIds,
      body.message
    );
    return {
      data: result,
      message: 'Bulk notifications sent successfully',
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiResponse({ status: 200, description: 'Notification deleted' })
  async delete(@Param('id') id: string, @Request() req) {
    const result = await this.notificationsService.delete(id, req.user.id);
    return result;
  }
}
