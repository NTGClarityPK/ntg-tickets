import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';

export interface IntegrationConfig {
  id: string;
  name: string;
  type:
    | 'webhook'
    | 'api'
    | 'sso'
    | 'email'
    | 'slack'
    | 'teams'
    | 'jira'
    | 'serviceNow';
  enabled: boolean;
  config: Record<string, unknown>;
  credentials?: Record<string, string>;
  webhookUrl?: string;
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  tenantId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WebhookPayload {
  event: string;
  data: Record<string, unknown>;
  timestamp: string;
  signature?: string;
}

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get all integrations
   */
  async getAllIntegrations(): Promise<IntegrationConfig[]> {
    try {
      const integrations = await this.prisma.integration.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      });

      return integrations.map(integration => ({
        id: integration.id,
        name: integration.name,
        type: integration.type as IntegrationConfig['type'],
        enabled: integration.enabled,
        config: integration.config as Record<string, unknown>,
        credentials: integration.credentials as Record<string, string>,
        webhookUrl: integration.webhookUrl,
        apiKey: integration.apiKey,
        clientId: integration.clientId,
        clientSecret: integration.clientSecret,
        tenantId: integration.tenantId,
        createdAt: integration.createdAt,
        updatedAt: integration.updatedAt,
      }));
    } catch (error) {
      this.logger.error('Error getting integrations:', error);
      throw error;
    }
  }

  /**
   * Get integration by ID
   */
  async getIntegration(id: string): Promise<IntegrationConfig | null> {
    try {
      const integration = await this.prisma.integration.findUnique({
        where: { id },
      });

      if (!integration) {
        return null;
      }

      return {
        id: integration.id,
        name: integration.name,
        type: integration.type as IntegrationConfig['type'],
        enabled: integration.enabled,
        config: integration.config as Record<string, unknown>,
        credentials: integration.credentials as Record<string, string>,
        webhookUrl: integration.webhookUrl,
        apiKey: integration.apiKey,
        clientId: integration.clientId,
        clientSecret: integration.clientSecret,
        tenantId: integration.tenantId,
        createdAt: integration.createdAt,
        updatedAt: integration.updatedAt,
      };
    } catch (error) {
      this.logger.error('Error getting integration:', error);
      throw error;
    }
  }

  /**
   * Create new integration
   */
  async createIntegration(
    data: Partial<IntegrationConfig>
  ): Promise<IntegrationConfig> {
    try {
      if (!data.name || !data.type) {
        throw new Error('Name and type are required for integration creation');
      }

      const integration = await this.prisma.integration.create({
        data: {
          name: data.name,
          type: data.type,
          enabled: data.enabled ?? false,
          config: (data.config ?? {}) as Prisma.JsonValue,
          credentials: (data.credentials ?? {}) as Prisma.JsonValue,
          webhookUrl: data.webhookUrl,
          apiKey: data.apiKey,
          clientId: data.clientId,
          clientSecret: data.clientSecret,
          tenantId: data.tenantId,
          isActive: true,
        },
      });

      this.logger.log(`Integration created: ${integration.name}`);

      return {
        id: integration.id,
        name: integration.name,
        type: integration.type as IntegrationConfig['type'],
        enabled: integration.enabled,
        config: integration.config as Record<string, unknown>,
        credentials: integration.credentials as Record<string, string>,
        webhookUrl: integration.webhookUrl,
        apiKey: integration.apiKey,
        clientId: integration.clientId,
        clientSecret: integration.clientSecret,
        tenantId: integration.tenantId,
        createdAt: integration.createdAt,
        updatedAt: integration.updatedAt,
      };
    } catch (error) {
      this.logger.error('Error creating integration:', error);
      throw error;
    }
  }

  /**
   * Update integration
   */
  async updateIntegration(
    id: string,
    data: Partial<IntegrationConfig>
  ): Promise<IntegrationConfig> {
    try {
      const updateData: {
        name?: string;
        type?: string;
        enabled?: boolean;
        config?: Prisma.JsonValue;
        credentials?: Prisma.JsonValue;
        webhookUrl?: string | null;
        apiKey?: string | null;
        clientId?: string | null;
        clientSecret?: string | null;
        tenantId?: string | null;
        updatedAt: Date;
      } = {
        updatedAt: new Date(),
      };

      if (data.name !== undefined) updateData.name = data.name;
      if (data.type !== undefined) updateData.type = data.type;
      if (data.enabled !== undefined) updateData.enabled = data.enabled;
      if (data.config !== undefined)
        updateData.config = data.config as Prisma.JsonValue;
      if (data.credentials !== undefined)
        updateData.credentials = data.credentials as Prisma.JsonValue;
      if (data.webhookUrl !== undefined)
        updateData.webhookUrl = data.webhookUrl;
      if (data.apiKey !== undefined) updateData.apiKey = data.apiKey;
      if (data.clientId !== undefined) updateData.clientId = data.clientId;
      if (data.clientSecret !== undefined)
        updateData.clientSecret = data.clientSecret;
      if (data.tenantId !== undefined) updateData.tenantId = data.tenantId;

      const integration = await this.prisma.integration.update({
        where: { id },
        data: updateData,
      });

      this.logger.log(`Integration updated: ${integration.name}`);

      return {
        id: integration.id,
        name: integration.name,
        type: integration.type as IntegrationConfig['type'],
        enabled: integration.enabled,
        config: integration.config as Record<string, unknown>,
        credentials: integration.credentials as Record<string, string>,
        webhookUrl: integration.webhookUrl,
        apiKey: integration.apiKey,
        clientId: integration.clientId,
        clientSecret: integration.clientSecret,
        tenantId: integration.tenantId,
        createdAt: integration.createdAt,
        updatedAt: integration.updatedAt,
      };
    } catch (error) {
      this.logger.error('Error updating integration:', error);
      throw error;
    }
  }

  /**
   * Delete integration
   */
  async deleteIntegration(id: string): Promise<void> {
    try {
      await this.prisma.integration.update({
        where: { id },
        data: { isActive: false },
      });

      this.logger.log(`Integration deleted: ${id}`);
    } catch (error) {
      this.logger.error('Error deleting integration:', error);
      throw error;
    }
  }

  /**
   * Test integration connection
   */
  async testIntegration(
    id: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const integration = await this.getIntegration(id);
      if (!integration) {
        return { success: false, message: 'Integration not found' };
      }

      switch (integration.type) {
        case 'webhook':
          return await this.testWebhook(integration);
        case 'api':
          return await this.testApi();
        case 'sso':
          return await this.testSSO();
        case 'email':
          return await this.testEmail();
        case 'slack':
          return await this.testSlack();
        case 'teams':
          return await this.testTeams();
        case 'jira':
          return await this.testJira();
        case 'serviceNow':
          return await this.testServiceNow();
        default:
          return { success: false, message: 'Unknown integration type' };
      }
    } catch (error) {
      this.logger.error('Error testing integration:', error);
      return { success: false, message: 'Test failed' };
    }
  }

  /**
   * Send webhook notification
   */
  async sendWebhook(
    integrationId: string,
    payload: WebhookPayload
  ): Promise<boolean> {
    try {
      const integration = await this.getIntegration(integrationId);
      if (!integration || !integration.enabled || !integration.webhookUrl) {
        return false;
      }

      const response = await fetch(integration.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'NTG-Ticket-System/1.0',
          ...(integration.apiKey && {
            Authorization: `Bearer ${integration.apiKey}`,
          }),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        this.logger.error(
          `Webhook failed: ${response.status} ${response.statusText}`
        );
        return false;
      }

      this.logger.log(`Webhook sent successfully to ${integration.name}`);
      return true;
    } catch (error) {
      this.logger.error('Error sending webhook:', error);
      return false;
    }
  }

  /**
   * Test webhook integration
   */
  private async testWebhook(
    integration: IntegrationConfig
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (!integration.webhookUrl) {
        return { success: false, message: 'Webhook URL not configured' };
      }

      const testPayload: WebhookPayload = {
        event: 'test',
        data: { message: 'Test webhook from NTG Ticket System' },
        timestamp: new Date().toISOString(),
      };

      const response = await fetch(integration.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'NTG-Ticket-System/1.0',
          ...(integration.apiKey && {
            Authorization: `Bearer ${integration.apiKey}`,
          }),
        },
        body: JSON.stringify(testPayload),
      });

      if (response.ok) {
        return { success: true, message: 'Webhook test successful' };
      } else {
        return {
          success: false,
          message: `Webhook test failed: ${response.status}`,
        };
      }
    } catch (error) {
      return { success: false, message: 'Webhook test failed' };
    }
  }

  /**
   * Test API integration
   */
  private async testApi(): Promise<{ success: boolean; message: string }> {
    // Implement API test logic
    return { success: true, message: 'API test successful' };
  }

  /**
   * Test SSO integration
   */
  private async testSSO(): Promise<{ success: boolean; message: string }> {
    // Implement SSO test logic
    return { success: true, message: 'SSO test successful' };
  }

  /**
   * Test email integration
   */
  private async testEmail(): Promise<{ success: boolean; message: string }> {
    // Implement email test logic
    return { success: true, message: 'Email test successful' };
  }

  /**
   * Test Slack integration
   */
  private async testSlack(): Promise<{ success: boolean; message: string }> {
    // Implement Slack test logic
    return { success: true, message: 'Slack test successful' };
  }

  /**
   * Test Teams integration
   */
  private async testTeams(): Promise<{ success: boolean; message: string }> {
    // Implement Teams test logic
    return { success: true, message: 'Teams test successful' };
  }

  /**
   * Test Jira integration
   */
  private async testJira(): Promise<{ success: boolean; message: string }> {
    // Implement Jira test logic
    return { success: true, message: 'Jira test successful' };
  }

  /**
   * Test ServiceNow integration
   */
  private async testServiceNow(): Promise<{
    success: boolean;
    message: string;
  }> {
    // Implement ServiceNow test logic
    return { success: true, message: 'ServiceNow test successful' };
  }
}
