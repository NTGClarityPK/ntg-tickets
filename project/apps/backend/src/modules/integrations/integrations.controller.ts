import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  IntegrationsService,
  IntegrationConfig,
  WebhookPayload,
} from './integrations.service';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';

@ApiTags('Integrations')
@Controller('integrations')
@UseGuards(SupabaseAuthGuard)
@ApiBearerAuth()
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all integrations' })
  @ApiResponse({
    status: 200,
    description: 'Integrations retrieved successfully',
  })
  async getAllIntegrations() {
    const integrations = await this.integrationsService.getAllIntegrations();
    return {
      data: integrations,
      message: 'Integrations retrieved successfully',
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get integration by ID' })
  @ApiResponse({
    status: 200,
    description: 'Integration retrieved successfully',
  })
  async getIntegration(@Param('id') id: string) {
    const integration = await this.integrationsService.getIntegration(id);
    return {
      data: integration,
      message: integration
        ? 'Integration retrieved successfully'
        : 'Integration not found',
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create new integration' })
  @ApiResponse({
    status: 201,
    description: 'Integration created successfully',
  })
  async createIntegration(@Body() data: Partial<IntegrationConfig>) {
    const integration = await this.integrationsService.createIntegration(data);
    return {
      data: integration,
      message: 'Integration created successfully',
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update integration' })
  @ApiResponse({
    status: 200,
    description: 'Integration updated successfully',
  })
  async updateIntegration(
    @Param('id') id: string,
    @Body() data: Partial<IntegrationConfig>
  ) {
    const integration = await this.integrationsService.updateIntegration(
      id,
      data
    );
    return {
      data: integration,
      message: 'Integration updated successfully',
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete integration' })
  @ApiResponse({
    status: 200,
    description: 'Integration deleted successfully',
  })
  async deleteIntegration(@Param('id') id: string) {
    await this.integrationsService.deleteIntegration(id);
    return {
      message: 'Integration deleted successfully',
    };
  }

  @Post(':id/test')
  @ApiOperation({ summary: 'Test integration connection' })
  @ApiResponse({
    status: 200,
    description: 'Integration test completed',
  })
  async testIntegration(@Param('id') id: string) {
    const result = await this.integrationsService.testIntegration(id);
    return {
      data: result,
      message: result.success
        ? 'Integration test successful'
        : 'Integration test failed',
    };
  }

  @Post(':id/webhook')
  @ApiOperation({ summary: 'Send webhook notification' })
  @ApiResponse({
    status: 200,
    description: 'Webhook sent successfully',
  })
  async sendWebhook(@Param('id') id: string, @Body() payload: WebhookPayload) {
    const success = await this.integrationsService.sendWebhook(id, payload);
    return {
      data: { success },
      message: success ? 'Webhook sent successfully' : 'Webhook failed',
    };
  }
}
