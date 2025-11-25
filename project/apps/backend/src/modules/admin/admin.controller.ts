import {
  Controller,
  Get,
  Patch,
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
import { AdminService } from './admin.service';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(SupabaseAuthGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get system statistics (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'System stats retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async getSystemStats(@Request() req) {
    // Check if user is admin
    if (req.user.activeRole !== 'ADMIN') {
      throw new Error('Forbidden - Admin access required');
    }

    const stats = await this.adminService.getSystemStats();
    return {
      data: stats,
      message: 'System stats retrieved successfully',
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Get system health status (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'System health retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async getSystemHealth(@Request() req) {
    // Check if user is admin
    if (req.user.activeRole !== 'ADMIN') {
      throw new Error('Forbidden - Admin access required');
    }

    const health = await this.adminService.getSystemHealth();
    return {
      data: health,
      message: 'System health retrieved successfully',
    };
  }

  @Get('config')
  @ApiOperation({ summary: 'Get system configuration (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'System configuration retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async getSystemConfiguration(@Request() req) {
    // Check if user is admin
    if (req.user.activeRole !== 'ADMIN') {
      throw new Error('Forbidden - Admin access required');
    }

    const config = await this.adminService.getSystemConfiguration();
    return {
      data: config,
      message: 'System configuration retrieved successfully',
    };
  }

  @Patch('config')
  @ApiOperation({ summary: 'Update system configuration (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'System configuration updated successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async updateSystemConfiguration(
    @Request() req,
    @Body() config: Record<string, unknown>
  ) {
    // Check if user is admin
    if (req.user.activeRole !== 'ADMIN') {
      throw new Error('Forbidden - Admin access required');
    }

    const result = await this.adminService.updateSystemConfiguration(config);
    return result;
  }

  @Get('public-config')
  @ApiOperation({ summary: 'Get public system configuration' })
  @ApiResponse({
    status: 200,
    description: 'Public system configuration retrieved successfully',
  })
  async getPublicConfiguration() {
    const config = await this.adminService.getPublicConfiguration();
    return {
      data: config,
      message: 'Public system configuration retrieved successfully',
    };
  }

  @Get('public-theme-settings')
  @ApiOperation({ summary: 'Get public theme settings' })
  @ApiResponse({
    status: 200,
    description: 'Public theme settings retrieved successfully',
  })
  async getPublicThemeSettings() {
    const themeSettings = await this.adminService.getThemeSettings();
    return {
      data: themeSettings,
      message: 'Public theme settings retrieved successfully',
    };
  }

  @Get('field-config')
  @ApiOperation({ summary: 'Get field configuration options (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Field configuration retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async getFieldConfig(@Request() req) {
    // Check if user is admin
    if (req.user.activeRole !== 'ADMIN') {
      throw new Error('Forbidden - Admin access required');
    }

    const fieldConfig = await this.adminService.getFieldConfig();
    return {
      data: fieldConfig,
      message: 'Field configuration retrieved successfully',
    };
  }

  @Patch('field-config')
  @ApiOperation({ summary: 'Update field configuration (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Field configuration updated successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async updateFieldConfig(
    @Request() req,
    @Body() fieldConfig: Record<string, unknown>
  ) {
    // Check if user is admin
    if (req.user.activeRole !== 'ADMIN') {
      throw new Error('Forbidden - Admin access required');
    }

    const updatedConfig =
      await this.adminService.updateFieldConfig(fieldConfig);
    return {
      data: updatedConfig,
      message: 'Field configuration updated successfully',
    };
  }

  @Get('theme-settings')
  @ApiOperation({ summary: 'Get theme settings (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Theme settings retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async getThemeSettings(@Request() req) {
    // Check if user is admin
    if (req.user.activeRole !== 'ADMIN') {
      throw new Error('Forbidden - Admin access required');
    }

    const themeSettings = await this.adminService.getThemeSettings();
    return {
      data: themeSettings,
      message: 'Theme settings retrieved successfully',
    };
  }

  @Patch('theme-settings')
  @ApiOperation({ summary: 'Update theme settings (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Theme settings updated successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async updateThemeSettings(
    @Request() req,
    @Body() themeData: {
      primaryColor?: string | null;
      logoUrl?: string | null;
      faviconUrl?: string | null;
      logoData?: string | null;
      faviconData?: string | null;
    }
  ) {
    // Check if user is admin
    if (req.user.activeRole !== 'ADMIN') {
      throw new Error('Forbidden - Admin access required');
    }

    console.log('Backend received theme data:', themeData);

    const result = await this.adminService.updateThemeSettings(themeData);
    return result;
  }
}
