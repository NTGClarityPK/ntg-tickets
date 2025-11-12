/**
 * @deprecated This file is maintained for backward compatibility.
 * New code should import directly from '../services/api' instead.
 *
 * This file re-exports all API clients and types from the new domain-specific structure.
 */

// Re-export all types from unified types
export type {
  User,
  CreateUserInput,
  UpdateUserInput,
  UserFilters,
  Ticket,
  CreateTicketInput,
  UpdateTicketInput,
  TicketFilters,
  Comment,
  Attachment,
  CustomField,
  CreateCustomFieldInput,
  UpdateCustomFieldInput,
  Category,
  Subcategory,
  SystemSettings,
  EmailTemplate,
  CreateEmailTemplateInput,
  UpdateEmailTemplateInput,
  ReportFilters,
  ApiResponse,
  CreateCommentInput,
  UserDistribution,
  SlaMetrics,
  ReportData,
  SystemMetrics,
  TeamPerformanceData,
  SearchCriteria,
  SavedSearch,
  CreateSavedSearchInput,
  UpdateSavedSearchInput,
  PopularSavedSearch,
  ElasticsearchFilters,
  ElasticsearchResult,
  SearchSuggestion,
  ElasticsearchHealth,
  Backup,
  AuditLog,
  AuditLogsFilters,
  DynamicField,
  AttachmentDownloadUrl,
  SystemStats,
  SystemHealth,
  Integration,
  CreateIntegrationInput,
  UpdateIntegrationInput,
  IntegrationTestResult,
  WebhookPayload,
  TicketFormData,
  DynamicTicketFormValues,
  EmailTemplateFormData,
  UserFormData,
  BulkUpdateData,
} from '../types/unified';

// Re-export Workflow types from workflows client
export type { Workflow, WorkflowData } from '../services/api/workflows.client';

// Re-export domain clients with legacy naming
import {
  httpClient,
  authClient,
  usersClient,
  ticketsClient,
  categoriesClient,
  systemClient,
  emailTemplatesClient,
  reportsClient,
  notificationsClient,
  elasticsearchClient,
  backupClient,
  auditLogsClient,
  savedSearchesClient,
  customFieldsClient,
  integrationsClient,
  workflowsClient,
  themeSettingsClient,
} from '../services/api';

// Export default axios instance for backward compatibility
export { httpClient as default };

// Re-export all API clients with legacy naming (authApi, userApi, etc.)
export const authApi = authClient;
export const userApi = usersClient;
export const ticketApi = ticketsClient;
export const categoriesApi = categoriesClient;
export const systemApi = systemClient;
export const emailTemplatesApi = emailTemplatesClient;
export const reportsApi = reportsClient;
export const notificationsApi = notificationsClient;
export const elasticsearchApi = elasticsearchClient;
export const backupApi = backupClient;
export const auditLogsApi = auditLogsClient;
export const savedSearchesApi = savedSearchesClient;
export const customFieldsApi = customFieldsClient;
export const integrationsApi = integrationsClient;
export const workflowsApi = workflowsClient;
export const themeSettingsApi = themeSettingsClient;

// Legacy apiClient export (for code that uses `apiClient` directly)
export const apiClient = httpClient;
