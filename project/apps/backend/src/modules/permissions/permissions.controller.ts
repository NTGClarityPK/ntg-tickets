import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { UserRole } from '@prisma/client';

@ApiTags('Permissions')
@Controller('permissions')
@UseGuards(SupabaseAuthGuard)
@ApiBearerAuth()
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get('check/:resource/:action')
  @ApiOperation({ summary: 'Check user permission for resource and action' })
  @ApiResponse({
    status: 200,
    description: 'Permission check result',
  })
  async checkPermission(
    @Request() req,
    @Param('resource') resource: string,
    @Param('action') action: string,
    @Body() context?: Record<string, unknown>
  ) {
    const hasPermission = await this.permissionsService.hasPermission(
      req.user.id,
      resource,
      action,
      req.user.activeRole,
      context
    );

    return {
      data: { hasPermission },
      message: hasPermission ? 'Permission granted' : 'Permission denied',
    };
  }

  @Get('role/:role')
  @ApiOperation({ summary: 'Get permissions for a specific role' })
  @ApiResponse({
    status: 200,
    description: 'Role permissions retrieved successfully',
  })
  async getRolePermissions(@Param('role') role: UserRole) {
    const permissions = this.permissionsService.getPermissionsForRole(role);

    return {
      data: permissions,
      message: 'Role permissions retrieved successfully',
    };
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all role permissions' })
  @ApiResponse({
    status: 200,
    description: 'All role permissions retrieved successfully',
  })
  async getAllRolePermissions() {
    const rolePermissions = this.permissionsService.getAllRolePermissions();

    return {
      data: rolePermissions,
      message: 'All role permissions retrieved successfully',
    };
  }

  @Post('ticket/:ticketId/:action')
  @ApiOperation({ summary: 'Check ticket access permission' })
  @ApiResponse({
    status: 200,
    description: 'Ticket access check result',
  })
  async checkTicketAccess(
    @Request() req,
    @Param('ticketId') ticketId: string,
    @Param('action') action: string
  ) {
    const canAccess = await this.permissionsService.canAccessTicket(
      req.user.id,
      ticketId,
      action
    );

    return {
      data: { canAccess },
      message: canAccess ? 'Access granted' : 'Access denied',
    };
  }

  @Post('user/:userId/:action')
  @ApiOperation({ summary: 'Check user access permission' })
  @ApiResponse({
    status: 200,
    description: 'User access check result',
  })
  async checkUserAccess(
    @Request() req,
    @Param('userId') userId: string,
    @Param('action') action: string
  ) {
    const canAccess = await this.permissionsService.canAccessUser(
      req.user.id,
      userId,
      action
    );

    return {
      data: { canAccess },
      message: canAccess ? 'Access granted' : 'Access denied',
    };
  }
}
