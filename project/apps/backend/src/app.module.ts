import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';

// Core modules
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { CommentsModule } from './modules/comments/comments.module';
import { AttachmentsModule } from './modules/attachments/attachments.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AdminModule } from './modules/admin/admin.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { WebSocketModule } from './modules/websocket/websocket.module';
import { ElasticsearchModule } from './modules/elasticsearch/elasticsearch.module';
import { VirusScanModule } from './modules/virus-scan/virus-scan.module';
import { SavedSearchesModule } from './modules/saved-searches/saved-searches.module';
import { EmailTemplatesModule } from './modules/email-templates/email-templates.module';
import { BackgroundJobsModule } from './modules/background-jobs/background-jobs.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { CustomFieldsModule } from './modules/custom-fields/custom-fields.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { WorkflowsModule } from './modules/workflows/workflows.module';

// Common modules
import { LoggerModule } from './common/logger/logger.module';
import { CacheModule } from './common/cache/cache.module';
import { EmailModule } from './common/email/email.module';
import { FileStorageModule } from './common/file-storage/file-storage.module';
import { SystemConfigModule } from './common/config/system-config.module';
import { AppConfigModule } from './config/app-config.module';
import { AppConfigService } from './config/app-config.service';

@Module({
  imports: [
    // Configuration
    AppConfigModule,

    // Rate limiting
    ThrottlerModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => {
        const rateLimit = config.rateLimit;
        return [
          {
            ttl: rateLimit.ttlSeconds,
            limit: rateLimit.limit,
          },
        ];
      },
    }),

    // Bull queue for background jobs
    BullModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => {
        const redis = config.redis;
        return {
          redis: {
            host: redis.host,
            port: redis.port,
            password: redis.password || undefined,
          },
        };
      },
    }),

    // Core modules
    DatabaseModule,
    LoggerModule,
    CacheModule,
    EmailModule,
    FileStorageModule,
    SystemConfigModule,

    // Feature modules
    AuthModule,
    UsersModule,
    TicketsModule,
    CommentsModule,
    AttachmentsModule,
    NotificationsModule,
    ReportsModule,
    AdminModule,
    CategoriesModule,
    WebSocketModule,
    ElasticsearchModule,
    VirusScanModule,
    SavedSearchesModule,
    EmailTemplatesModule,
    BackgroundJobsModule,
    PermissionsModule,
    IntegrationsModule,
    CustomFieldsModule,
    AuditLogsModule,
    WorkflowsModule,
  ],
})
export class AppModule {}
