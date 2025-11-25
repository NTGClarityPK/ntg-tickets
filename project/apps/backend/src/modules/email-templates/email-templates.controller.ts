import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { EmailTemplatesService } from './email-templates.service';
import { CreateEmailTemplateDto } from './dto/create-email-template.dto';
import { UpdateEmailTemplateDto } from './dto/update-email-template.dto';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Email Templates')
@Controller('email-templates')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@ApiBearerAuth()
export class EmailTemplatesController {
  constructor(private readonly emailTemplatesService: EmailTemplatesService) {}

  @Post()
  @Roles('ADMIN', 'SUPPORT_MANAGER')
  @ApiOperation({ summary: 'Create a new email template' })
  @ApiResponse({
    status: 201,
    description: 'Email template created successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async create(@Body() createEmailTemplateDto: CreateEmailTemplateDto) {
    const emailTemplate = await this.emailTemplatesService.create(
      createEmailTemplateDto
    );
    return {
      data: emailTemplate,
      message: 'Email template created successfully',
    };
  }

  @Get()
  @Roles('ADMIN', 'SUPPORT_MANAGER')
  @ApiOperation({ summary: 'Get all email templates' })
  @ApiResponse({
    status: 200,
    description: 'Email templates retrieved successfully',
  })
  async findAll() {
    const emailTemplates = await this.emailTemplatesService.findAll();
    return {
      data: emailTemplates,
      message: 'Email templates retrieved successfully',
    };
  }

  @Get('defaults')
  @Roles('ADMIN', 'SUPPORT_MANAGER')
  @ApiOperation({ summary: 'Create default email templates' })
  @ApiResponse({
    status: 200,
    description: 'Default email templates created successfully',
  })
  async createDefaults() {
    await this.emailTemplatesService.createDefaultTemplates();
    return {
      message: 'Default email templates created successfully',
    };
  }

  @Get(':id')
  @Roles('ADMIN', 'SUPPORT_MANAGER')
  @ApiOperation({ summary: 'Get email template by ID' })
  @ApiResponse({
    status: 200,
    description: 'Email template retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Email template not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const emailTemplate = await this.emailTemplatesService.findOne(id);
    return {
      data: emailTemplate,
      message: 'Email template retrieved successfully',
    };
  }

  @Get(':id/preview')
  @Roles('ADMIN', 'SUPPORT_MANAGER')
  @ApiOperation({ summary: 'Preview email template with sample data' })
  @ApiResponse({
    status: 200,
    description: 'Email template preview generated successfully',
  })
  async preview(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() variables: Record<string, string | number | boolean>
  ) {
    const preview = await this.emailTemplatesService.previewTemplate(
      id,
      variables
    );
    return {
      data: preview,
      message: 'Email template preview generated successfully',
    };
  }

  @Patch(':id')
  @Roles('ADMIN', 'SUPPORT_MANAGER')
  @ApiOperation({ summary: 'Update email template' })
  @ApiResponse({
    status: 200,
    description: 'Email template updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Email template not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateEmailTemplateDto: UpdateEmailTemplateDto
  ) {
    const emailTemplate = await this.emailTemplatesService.update(
      id,
      updateEmailTemplateDto
    );
    return {
      data: emailTemplate,
      message: 'Email template updated successfully',
    };
  }

  @Delete(':id')
  @Roles('ADMIN', 'SUPPORT_MANAGER')
  @ApiOperation({ summary: 'Delete email template' })
  @ApiResponse({
    status: 200,
    description: 'Email template deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Email template not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.emailTemplatesService.remove(id);
    return result;
  }
}
