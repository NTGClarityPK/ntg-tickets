import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ConfigService } from '@nestjs/config';

export interface SystemConfig {
  // General Settings
  siteName: string;
  siteDescription: string;
  timezone: string;
  language: string;
  dateFormat: string;

  // Notification Settings
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  notificationFrequency: string;

  // Security Settings
  passwordMinLength: number;
  requireTwoFactor: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;

  // System Settings
  autoAssignTickets: boolean;
  autoCloseResolved: boolean;
  autoCloseDays: number;
  enableAuditLog: boolean;
  enableBackup: boolean;
  backupFrequency: string;

  // Email Settings
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  fromEmail: string;
  fromName: string;
}

@Injectable()
export class SystemConfigService implements OnModuleInit {
  private readonly logger = new Logger(SystemConfigService.name);
  private config: SystemConfig;
  private configCache: Map<string, unknown> = new Map();
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes
  private lastCacheUpdate = 0;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService
  ) {}

  async onModuleInit() {
    await this.loadSystemConfig();
    this.logger.log('System configuration loaded successfully');
  }

  async loadSystemConfig(): Promise<SystemConfig> {
    try {
      const settings = await this.prisma.systemSettings.findMany();

      // Convert array of key-value pairs to object
      const settingsObj = settings.reduce(
        (acc, setting) => {
          acc[setting.key] = setting.value;
          return acc;
        },
        {} as Record<string, string>
      );

      this.config = {
        // General Settings
        siteName: settingsObj.site_name || 'NTG Ticket',
        siteDescription:
          settingsObj.site_description ||
          'IT Support - Ticket Management System',
        timezone: settingsObj.timezone || 'UTC',
        language: settingsObj.language || 'en',
        dateFormat: 'MM/DD/YYYY',

        // Notification Settings
        emailNotifications: settingsObj.email_notifications_enabled === 'true',
        pushNotifications: true,
        smsNotifications: false,
        notificationFrequency: 'immediate',

        // Security Settings
        passwordMinLength: parseInt(settingsObj.password_min_length || '8'),
        requireTwoFactor: false,
        sessionTimeout: parseInt(settingsObj.session_timeout || '30'),
        maxLoginAttempts: parseInt(settingsObj.max_login_attempts || '5'),

        // System Settings
        autoAssignTickets: settingsObj.auto_assign_tickets === 'true',
        autoCloseResolved: settingsObj.auto_close_resolved_tickets === 'true',
        autoCloseDays: parseInt(settingsObj.auto_close_days || '7'),
        enableAuditLog: true,
        enableBackup: true,
        backupFrequency: 'daily',

        // Email Settings
        smtpHost:
          settingsObj.smtp_host ||
          this.configService.get('SMTP_HOST', 'smtp.gmail.com'),
        smtpPort: parseInt(
          settingsObj.smtp_port || this.configService.get('SMTP_PORT', '587')
        ),
        smtpUsername:
          settingsObj.smtp_username || this.configService.get('SMTP_USER', ''),
        smtpPassword:
          settingsObj.smtp_password || this.configService.get('SMTP_PASS', ''),
        fromEmail:
          settingsObj.from_email ||
          this.configService.get('SMTP_FROM', 'noreply@ntg-ticket.com'),
        fromName: settingsObj.from_name || 'NTG Ticket',
      };

      this.lastCacheUpdate = Date.now();
      this.logger.log('System configuration reloaded from database');
      return this.config;
    } catch (error) {
      this.logger.error('Error loading system configuration:', error);
      // Fallback to default config
      return this.getDefaultConfig();
    }
  }

  getConfig(): SystemConfig {
    // Return cached config if still valid
    if (this.config && Date.now() - this.lastCacheUpdate < this.cacheExpiry) {
      return this.config;
    }

    // If config is not initialized, return default config
    if (!this.config) {
      return this.getDefaultConfig();
    }

    // Reload config if cache expired
    this.loadSystemConfig();
    return this.config;
  }

  async getSetting(key: string): Promise<unknown> {
    const cacheKey = `setting_${key}`;
    const now = Date.now();

    // Check cache first
    if (
      this.configCache.has(cacheKey) &&
      now - this.lastCacheUpdate < this.cacheExpiry
    ) {
      return this.configCache.get(cacheKey);
    }

    try {
      const setting = await this.prisma.systemSettings.findUnique({
        where: { key },
      });

      const value = setting?.value;
      this.configCache.set(cacheKey, value);
      return value;
    } catch (error) {
      this.logger.error(`Error getting setting ${key}:`, error);
      return null;
    }
  }

  async updateSetting(key: string, value: string): Promise<void> {
    try {
      await this.prisma.systemSettings.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });

      // Clear cache to force reload
      this.configCache.clear();
      this.lastCacheUpdate = 0;

      this.logger.log(`Setting ${key} updated to ${value}`);
    } catch (error) {
      this.logger.error(`Error updating setting ${key}:`, error);
      throw error;
    }
  }

  async updateConfig(config: Partial<SystemConfig>): Promise<void> {
    try {
      const settingsToUpdate = [
        { key: 'site_name', value: config.siteName },
        { key: 'site_description', value: config.siteDescription },
        { key: 'timezone', value: config.timezone },
        { key: 'language', value: config.language },
        {
          key: 'email_notifications_enabled',
          value: config.emailNotifications?.toString(),
        },
        {
          key: 'password_min_length',
          value: config.passwordMinLength?.toString(),
        },
        { key: 'session_timeout', value: config.sessionTimeout?.toString() },
        {
          key: 'max_login_attempts',
          value: config.maxLoginAttempts?.toString(),
        },
        {
          key: 'auto_assign_tickets',
          value: config.autoAssignTickets?.toString(),
        },
        {
          key: 'auto_close_resolved_tickets',
          value: config.autoCloseResolved?.toString(),
        },
        { key: 'auto_close_days', value: config.autoCloseDays?.toString() },
        { key: 'smtp_host', value: config.smtpHost },
        { key: 'smtp_port', value: config.smtpPort?.toString() },
        { key: 'smtp_username', value: config.smtpUsername },
        { key: 'smtp_password', value: config.smtpPassword },
        { key: 'from_email', value: config.fromEmail },
        { key: 'from_name', value: config.fromName },
      ];

      // Update each setting
      for (const setting of settingsToUpdate) {
        if (setting.value !== undefined) {
          await this.prisma.systemSettings.upsert({
            where: { key: setting.key },
            update: { value: setting.value },
            create: setting,
          });
        }
      }

      // Clear cache to force reload
      this.configCache.clear();
      this.lastCacheUpdate = 0;

      this.logger.log('System configuration updated successfully');
    } catch (error) {
      this.logger.error('Error updating system configuration:', error);
      throw error;
    }
  }

  private getDefaultConfig(): SystemConfig {
    return {
      siteName: 'NTG Ticket',
      siteDescription: 'IT Support - Ticket Management System',
      timezone: 'UTC',
      language: 'en',
      dateFormat: 'MM/DD/YYYY',
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
      notificationFrequency: 'immediate',
      passwordMinLength: 8,
      requireTwoFactor: false,
      sessionTimeout: 30,
      maxLoginAttempts: 5,
      autoAssignTickets: false,
      autoCloseResolved: false,
      autoCloseDays: 7,
      enableAuditLog: true,
      enableBackup: true,
      backupFrequency: 'daily',
      smtpHost: this.configService.get('SMTP_HOST', 'smtp.gmail.com'),
      smtpPort: parseInt(this.configService.get('SMTP_PORT', '587')),
      smtpUsername: this.configService.get('SMTP_USER', ''),
      smtpPassword: this.configService.get('SMTP_PASS', ''),
      fromEmail: this.configService.get('SMTP_FROM', 'noreply@ntg-ticket.com'),
      fromName: 'NTG Ticket',
    };
  }

  // Convenience methods for commonly used settings
  getPasswordMinLength(): number {
    const config = this.getConfig();
    return config?.passwordMinLength || 8;
  }

  getSessionTimeout(): number {
    const config = this.getConfig();
    return config?.sessionTimeout || 30;
  }

  getMaxLoginAttempts(): number {
    const config = this.getConfig();
    return config?.maxLoginAttempts || 5;
  }

  getEmailConfig() {
    const config = this.getConfig();
    return {
      host:
        config?.smtpHost ||
        this.configService.get('SMTP_HOST', 'smtp.gmail.com'),
      port:
        config?.smtpPort ||
        parseInt(this.configService.get('SMTP_PORT', '587')),
      username: config?.smtpUsername || this.configService.get('SMTP_USER', ''),
      password: config?.smtpPassword || this.configService.get('SMTP_PASS', ''),
      fromEmail:
        config?.fromEmail ||
        this.configService.get('SMTP_FROM', 'noreply@ntg-ticket.com'),
      fromName: config?.fromName || 'NTG Ticket',
    };
  }

  isAutoAssignEnabled(): boolean {
    const config = this.getConfig();
    return config?.autoAssignTickets || false;
  }

  isAutoCloseEnabled(): boolean {
    const config = this.getConfig();
    return config?.autoCloseResolved || false;
  }

  getAutoCloseDays(): number {
    const config = this.getConfig();
    return config?.autoCloseDays || 7;
  }
}
