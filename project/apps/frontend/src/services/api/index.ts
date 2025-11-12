/**
 * Domain-specific API clients
 * Each client handles a specific domain (auth, users, tickets, etc.)
 * All clients use the shared httpClient for consistent auth and error handling
 */

export { httpClient, createHttpClient } from './http-client';
export { authClient } from './auth.client';
export { usersClient } from './users.client';
export { ticketsClient } from './tickets.client';
export { categoriesClient } from './categories.client';
export { systemClient } from './system.client';
export { emailTemplatesClient } from './email-templates.client';
export { reportsClient } from './reports.client';
export { notificationsClient } from './notifications.client';
export { elasticsearchClient } from './elasticsearch.client';
export { backupClient } from './backup.client';
export { auditLogsClient } from './audit-logs.client';
export { savedSearchesClient } from './saved-searches.client';
export { customFieldsClient } from './custom-fields.client';
export { integrationsClient } from './integrations.client';
export { workflowsClient } from './workflows.client';
export { themeSettingsClient } from './theme-settings.client';

// Re-export types
export type { LoginCredentials, AuthTokens, LoginResponse, SwitchRoleResponse } from './auth.client';
export type { PaginatedUsersResponse } from './users.client';
export type { PaginatedTicketsResponse } from './tickets.client';
export type { PublicSettings } from './system.client';
export type { UserReportResponse, SlaReportResponse } from './reports.client';
export type { Notification } from './notifications.client';
export type { PaginatedAuditLogsResponse, AuditLogStats } from './audit-logs.client';
export type { PaginatedTicketsResponse as SavedSearchTicketsResponse } from './saved-searches.client';
export type { Workflow, WorkflowData } from './workflows.client';
export type {
  ThemeSettings,
  PublicThemeSettings,
  UpdateThemeSettingsInput,
  UpdateThemeSettingsResponse,
} from './theme-settings.client';


