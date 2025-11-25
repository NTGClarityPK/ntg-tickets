import { Controller, Post, Get, UseGuards, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BackupService } from './backup.service';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('backup')
@Controller('backup')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@ApiBearerAuth()
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create database backup' })
  @ApiResponse({ status: 201, description: 'Backup created successfully' })
  @Roles(UserRole.ADMIN)
  async createBackup() {
    return this.backupService.createDataBackup();
  }

  @Get('list')
  @ApiOperation({ summary: 'List available backups' })
  @ApiResponse({ status: 200, description: 'Backups retrieved successfully' })
  @Roles(UserRole.ADMIN, UserRole.SUPPORT_MANAGER)
  async listBackups() {
    return this.backupService.listBackups();
  }

  @Post('restore')
  @ApiOperation({ summary: 'Restore from backup' })
  @ApiResponse({ status: 200, description: 'Backup restored successfully' })
  @Roles(UserRole.ADMIN)
  async restoreBackup(@Query('backupId') backupId: string) {
    return this.backupService.restoreDataBackup(backupId);
  }
}
