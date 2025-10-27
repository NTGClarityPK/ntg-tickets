import axios from 'axios';
import { getSession, signOut } from 'next-auth/react';
import {
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
} from '../types/unified';
import { API_CONFIG } from './constants';

const API_BASE_URL = API_CONFIG.BASE_URL;

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

// Create axios instance
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async config => {
    // First try to get token from localStorage (for role switches)
    const localAccessToken = localStorage.getItem('access_token');
    
    if (localAccessToken) {
      config.headers.Authorization = `Bearer ${localAccessToken}`;
    } else {
      // Fallback to NextAuth session
      const session = await getSession();
      
      if (session?.accessToken) {
        config.headers.Authorization = `Bearer ${session.accessToken}`;
      }
    }
    
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and token refresh
apiClient.interceptors.response.use(
  response => {
    return response;
  },
  async error => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // First try to get refresh token from localStorage
        const localRefreshToken = localStorage.getItem('refresh_token');
        
        if (localRefreshToken) {
          // Try to refresh the token using localStorage token
          const refreshResponse = await axios.post(
            `${API_BASE_URL}/api/v1/auth/refresh`,
            { refresh_token: localRefreshToken }
          );

          if (refreshResponse.data?.data) {
            const { access_token, refresh_token } = refreshResponse.data.data;

            // Update localStorage with new tokens
            localStorage.setItem('access_token', access_token);
            if (refresh_token) {
              localStorage.setItem('refresh_token', refresh_token);
            }

            // Update the authorization header and retry the request
            originalRequest.headers.Authorization = `Bearer ${access_token}`;

            // Retry the original request
            return apiClient(originalRequest);
          }
        } else {
          // Fallback to NextAuth session
          const session = await getSession();
          if (session?.refreshToken) {
            // Try to refresh the token
            const refreshResponse = await axios.post(
              `${API_BASE_URL}/api/v1/auth/refresh`,
              { refresh_token: session.refreshToken }
            );

            if (refreshResponse.data?.data) {
              const { access_token } = refreshResponse.data.data;

              // Update the authorization header and retry the request
              originalRequest.headers.Authorization = `Bearer ${access_token}`;

              // Retry the original request
              return apiClient(originalRequest);
            }
          }
        }
      } catch (refreshError) {
        // If refresh fails, sign out the user
        await signOut({ callbackUrl: '/auth/signin' });
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ===== AUTH API =====
export const authApi = {
  login: (credentials: {
    email: string;
    password: string;
    activeRole?: string;
  }) =>
    apiClient.post<
      ApiResponse<{ access_token: string; refresh_token: string; user: User }>
    >('/auth/login', credentials),

  getCurrentUser: () => apiClient.get<ApiResponse<User>>('/auth/me'),

  logout: () => apiClient.post<ApiResponse<void>>('/auth/logout'),

  refreshToken: (refreshToken: string) =>
    apiClient.post<
      ApiResponse<{ access_token: string; refresh_token: string }>
    >('/auth/refresh', { refresh_token: refreshToken }),

  updateUserRole: (userId: string, role: string) =>
    apiClient.patch<ApiResponse<User>>(`/auth/users/${userId}/role`, { role }),

  switchRole: (data: { activeRole: string }) =>
    apiClient.post<
      ApiResponse<{
        access_token: string;
        refresh_token: string;
        user: {
          id: string;
          email: string;
          name: string;
          roles: string[];
          activeRole: string;
        };
      }>
    >('/auth/switch-role', data),
};

// ===== USER API =====
export const userApi = {
  getUsers: (filters?: UserFilters) =>
    apiClient.get<
      ApiResponse<{
        data: User[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }>
    >('/users', { params: filters }),

  getUser: (id: string) => apiClient.get<ApiResponse<User>>(`/users/${id}`),

  createUser: (data: CreateUserInput) =>
    apiClient.post<ApiResponse<User>>('/users', data),

  updateUser: (id: string, data: UpdateUserInput) =>
    apiClient.patch<ApiResponse<User>>(`/users/${id}`, data),

  deleteUser: (id: string) => apiClient.delete(`/users/${id}`),

  getSupportStaff: () =>
    apiClient.get<ApiResponse<User[]>>('/users/support-staff'),
};

// ===== TICKET API =====
export const ticketApi = {
  getTickets: (filters?: TicketFilters) =>
    apiClient.get<
      ApiResponse<{
        data: Ticket[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }>
    >('/tickets', { params: filters }),

  getTicket: (id: string) =>
    apiClient.get<ApiResponse<Ticket>>(`/tickets/${id}`),

  createTicket: (data: CreateTicketInput) =>
    apiClient.post<ApiResponse<Ticket>>('/tickets', data),

  updateTicket: (id: string, data: UpdateTicketInput) =>
    apiClient.patch<ApiResponse<Ticket>>(`/tickets/${id}`, data),

  deleteTicket: (id: string) => apiClient.delete(`/tickets/${id}`),

  assignTicket: (id: string, assignedToId: string) =>
    apiClient.patch<ApiResponse<Ticket>>(`/tickets/${id}/assign`, {
      assignedToId,
    }),

  updateStatus: (id: string, status: string, resolution?: string) => {
    const requestData = { status, resolution };
    return apiClient.patch<ApiResponse<Ticket>>(
      `/tickets/${id}/status`,
      requestData
    );
  },

  addComment: (data: CreateCommentInput) =>
    apiClient.post<ApiResponse<Comment>>('/comments', data),

  getComments: (ticketId: string) =>
    apiClient.get<ApiResponse<Comment[]>>(`/comments/ticket/${ticketId}`),

  getComment: (id: string) =>
    apiClient.get<ApiResponse<Comment>>(`/comments/${id}`),

  updateComment: (
    id: string,
    data: { content: string; isInternal?: boolean }
  ) => apiClient.patch<ApiResponse<Comment>>(`/comments/${id}`, data),

  deleteComment: (id: string) =>
    apiClient.delete<ApiResponse<{ message: string }>>(`/comments/${id}`),

  uploadAttachment: (ticketId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post<ApiResponse<Attachment>>(
      `/attachments/ticket/${ticketId}`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
  },

  getAttachments: (ticketId: string) =>
    apiClient.get<ApiResponse<Attachment[]>>(`/attachments/ticket/${ticketId}`),

  getAttachment: (id: string) =>
    apiClient.get<ApiResponse<Attachment>>(`/attachments/${id}`),

  getAttachmentDownloadUrl: (id: string) =>
    apiClient.get<ApiResponse<AttachmentDownloadUrl>>(
      `/attachments/${id}/download`
    ),

  deleteAttachment: (id: string) =>
    apiClient.delete<ApiResponse<{ message: string }>>(`/attachments/${id}`),

  // Additional ticket endpoints
  getMyTickets: (filters?: TicketFilters) =>
    apiClient.get<
      ApiResponse<{
        data: Ticket[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }>
    >('/tickets/my', { params: filters }),

  getAssignedTickets: (filters?: TicketFilters) =>
    apiClient.get<
      ApiResponse<{
        data: Ticket[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }>
    >('/tickets/assigned', { params: filters }),

  getOverdueTickets: () =>
    apiClient.get<ApiResponse<Ticket[]>>('/tickets/overdue'),

  getTicketsApproachingSLA: () =>
    apiClient.get<ApiResponse<Ticket[]>>('/tickets/approaching-sla'),

  getBreachedSLATickets: () =>
    apiClient.get<ApiResponse<Ticket[]>>('/tickets/breached-sla'),
};

// ===== CATEGORIES API =====
export const categoriesApi = {
  getCategories: () => apiClient.get<ApiResponse<Category[]>>('/categories'),

  getActiveCategories: () => apiClient.get<ApiResponse<Category[]>>('/categories/active'),

  getCategory: (id: string) =>
    apiClient.get<ApiResponse<Category>>(`/categories/${id}`),

  createCategory: (data: Partial<Category>) =>
    apiClient.post<ApiResponse<Category>>('/categories', data),

  updateCategory: (id: string, data: Partial<Category>) =>
    apiClient.patch<ApiResponse<Category>>(`/categories/${id}`, data),

  deleteCategory: (id: string) => apiClient.delete(`/categories/${id}`),

  getDynamicFields: (categoryName: string) =>
    apiClient.get<ApiResponse<DynamicField[]>>(
      `/categories/dynamic-fields/${categoryName}`
    ),

  getSubcategories: (categoryName: string) =>
    apiClient.get<ApiResponse<Subcategory[]>>(
      `/categories/subcategories/${categoryName}`
    ),

  createSubcategory: (categoryId: string, data: Partial<Subcategory>) =>
    apiClient.post<ApiResponse<Subcategory>>(
      `/categories/${categoryId}/subcategories`,
      data
    ),

  updateSubcategory: (
    categoryId: string,
    subcategoryId: string,
    data: Partial<Subcategory>
  ) =>
    apiClient.put<ApiResponse<Subcategory>>(
      `/categories/${categoryId}/subcategories/${subcategoryId}`,
      data
    ),

  deleteSubcategory: (categoryId: string, subcategoryId: string) =>
    apiClient.delete(
      `/categories/${categoryId}/subcategories/${subcategoryId}`
    ),
};

// ===== SYSTEM SETTINGS API =====
export const systemApi = {
  getSettings: () =>
    apiClient.get<ApiResponse<SystemSettings>>('/admin/config'),

  getPublicSettings: () =>
    apiClient.get<
      ApiResponse<{
        siteName: string;
        siteDescription: string;
        timezone: string;
        language: string;
        dateFormat: string;
      }>
    >('/admin/public-config'),

  updateSettings: (data: Partial<SystemSettings>) =>
    apiClient.patch<ApiResponse<SystemSettings>>('/admin/config', data),

  getSystemStats: () => apiClient.get<ApiResponse<SystemStats>>('/admin/stats'),

  getSystemHealth: () =>
    apiClient.get<ApiResponse<SystemHealth>>('/admin/health'),
};

// ===== EMAIL TEMPLATES API =====
export const emailTemplatesApi = {
  getEmailTemplates: () =>
    apiClient.get<ApiResponse<EmailTemplate[]>>('/email-templates'),

  getEmailTemplate: (id: string) =>
    apiClient.get<ApiResponse<EmailTemplate>>(`/email-templates/${id}`),

  createEmailTemplate: (data: CreateEmailTemplateInput) =>
    apiClient.post<ApiResponse<EmailTemplate>>('/email-templates', data),

  updateEmailTemplate: (id: string, data: UpdateEmailTemplateInput) =>
    apiClient.patch<ApiResponse<EmailTemplate>>(`/email-templates/${id}`, data),

  deleteEmailTemplate: (id: string) =>
    apiClient.delete(`/email-templates/${id}`),

  createDefaultTemplates: () =>
    apiClient.get<ApiResponse<void>>('/email-templates/defaults'),

  previewEmailTemplate: (id: string, variables: Record<string, unknown>) =>
    apiClient.get<ApiResponse<{ subject: string; html: string }>>(
      `/email-templates/${id}/preview`,
      { params: variables }
    ),
};

// ===== REPORTS API =====
export const reportsApi = {
  getTicketReport: (filters?: ReportFilters) =>
    apiClient.get<ApiResponse<ReportData>>('/reports/tickets', {
      params: filters,
    }),

  getUserReport: (filters?: ReportFilters) =>
    apiClient.get<
      ApiResponse<{
        users: User[];
        stats: { total: number; active: number; inactive: number };
      }>
    >('/reports/users', { params: filters }),

  getSlaReport: (filters?: ReportFilters) =>
    apiClient.get<
      ApiResponse<{
        slaMetrics: SlaMetrics;
        compliance: number;
        violations: number;
      }>
    >('/reports/sla', { params: filters }),

  exportReport: (
    type: string,
    format: string,
    filters?: ReportFilters,
    data?: unknown
  ) => {
    // Debug logging removed for production
    return apiClient.post(
      `/reports/export/${type}`,
      {
        format,
        filters,
        data,
      },
      {
        responseType: 'blob',
      }
    );
  },

  exportReports: (filters?: ReportFilters) =>
    apiClient.post<Blob>('/reports/export', filters, {
      responseType: 'blob',
    }),

  getSystemMetrics: () =>
    apiClient.get<ApiResponse<SystemMetrics>>('/reports/system-metrics'),

  getUserDistribution: () =>
    apiClient.get<ApiResponse<UserDistribution[]>>(
      '/reports/user-distribution'
    ),
};

// ===== NOTIFICATIONS API =====
export const notificationsApi = {
  getNotifications: () =>
    apiClient.get<
      ApiResponse<
        Array<{
          id: string;
          userId: string;
          ticketId?: string;
          type: string;
          title: string;
          message: string;
          isRead: boolean;
          createdAt: string;
          ticket?: {
            id: string;
            ticketNumber: string;
            title: string;
          };
        }>
      >
    >('/notifications'),

  markAsRead: (id: string) => apiClient.patch(`/notifications/${id}/read`),

  markAllAsRead: () => apiClient.patch('/notifications/read-all'),

  deleteNotification: (id: string) => apiClient.delete(`/notifications/${id}`),

  sendBulkNotification: (ticketIds: string[], message: string) =>
    apiClient.post<ApiResponse<{ sent: number; failed: number }>>(
      '/notifications/bulk',
      {
        ticketIds,
        message,
      }
    ),
};

// ===== ELASTICSEARCH API =====
export const elasticsearchApi = {
  searchTickets: (query: string, filters?: ElasticsearchFilters) =>
    apiClient.get<ApiResponse<ElasticsearchResult>>('/elasticsearch/search', {
      params: {
        q: query,
        ...filters,
        status: filters?.status?.join(','),
        priority: filters?.priority?.join(','),
        category: filters?.category?.join(','),
        assignedTo: filters?.assignedTo?.join(','),
      },
    }),

  getSuggestions: (query: string, field: string = 'title') =>
    apiClient.get<ApiResponse<SearchSuggestion[]>>(
      '/elasticsearch/suggestions',
      {
        params: { q: query, field },
      }
    ),

  getAggregations: (filters?: {
    status?: string[];
    priority?: string[];
    category?: string[];
  }) =>
    apiClient.get<ApiResponse<Record<string, unknown>>>(
      '/elasticsearch/aggregations',
      {
        params: {
          status: filters?.status?.join(','),
          priority: filters?.priority?.join(','),
          category: filters?.category?.join(','),
        },
      }
    ),

  getHealth: () =>
    apiClient.get<ApiResponse<ElasticsearchHealth>>('/elasticsearch/health'),

  reindex: () =>
    apiClient.post<ApiResponse<{ message: string }>>('/elasticsearch/reindex'),
};

// ===== BACKUP API =====
export const backupApi = {
  createBackup: () => apiClient.post<ApiResponse<Backup>>('/backup/create'),

  listBackups: () => apiClient.get<ApiResponse<Backup[]>>('/backup/list'),

  restoreBackup: (backupId: string) =>
    apiClient.post<ApiResponse<{ message: string }>>('/backup/restore', null, {
      params: { backupId },
    }),

  delete: (backupId: string) =>
    apiClient.delete<ApiResponse<{ message: string }>>('/backup/delete', {
      params: { backupId },
    }),
};

// ===== AUDIT LOGS API =====
export const auditLogsApi = {
  getAuditLogs: (filters?: AuditLogsFilters) =>
    apiClient.get<
      ApiResponse<{
        data: AuditLog[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }>
    >('/audit-logs', { params: filters }),

  getTicketAuditLogs: (ticketId: string, page?: number, limit?: number) =>
    apiClient.get<
      ApiResponse<{
        data: AuditLog[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }>
    >(`/audit-logs/ticket/${ticketId}`, { params: { page, limit } }),

  getSystemAuditLogs: (
    page?: number,
    limit?: number,
    dateFrom?: string,
    dateTo?: string
  ) =>
    apiClient.get<
      ApiResponse<{
        data: AuditLog[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }>
    >('/audit-logs/system', { params: { page, limit, dateFrom, dateTo } }),

  getUserActivityLogs: (
    userId: string,
    page?: number,
    limit?: number,
    dateFrom?: string,
    dateTo?: string
  ) =>
    apiClient.get<
      ApiResponse<{
        data: AuditLog[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }>
    >(`/audit-logs/user/${userId}/activity`, {
      params: { page, limit, dateFrom, dateTo },
    }),

  getAuditLogStats: (dateFrom?: string, dateTo?: string) =>
    apiClient.get<
      ApiResponse<{
        totalLogs: number;
        logsByAction: Record<string, number>;
        logsByResource: Record<string, number>;
        logsByUser: Array<{ userId: string; userName: string; count: number }>;
        dailyActivity: Array<{ date: string; count: number }>;
      }>
    >('/audit-logs/stats', { params: { dateFrom, dateTo } }),
};

// ===== SAVED SEARCHES API =====
export const savedSearchesApi = {
  getSavedSearches: (includePublic?: boolean) =>
    apiClient.get<ApiResponse<SavedSearch[]>>('/saved-searches', {
      params: { includePublic },
    }),

  createSavedSearch: (data: CreateSavedSearchInput) =>
    apiClient.post<ApiResponse<SavedSearch>>('/saved-searches', data),

  getSavedSearch: (id: string) =>
    apiClient.get<ApiResponse<SavedSearch>>(`/saved-searches/${id}`),

  executeSavedSearch: (id: string, page?: number, limit?: number) =>
    apiClient.get<
      ApiResponse<{
        data: Ticket[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }>
    >(`/saved-searches/${id}/execute`, { params: { page, limit } }),

  duplicateSavedSearch: (id: string, name?: string) =>
    apiClient.post<ApiResponse<SavedSearch>>(
      `/saved-searches/${id}/duplicate`,
      { name }
    ),

  getPopularSearches: (limit?: number) =>
    apiClient.get<ApiResponse<PopularSavedSearch[]>>(
      '/saved-searches/popular',
      {
        params: { limit },
      }
    ),

  updateSavedSearch: (id: string, data: UpdateSavedSearchInput) =>
    apiClient.patch<ApiResponse<SavedSearch>>(`/saved-searches/${id}`, data),

  deleteSavedSearch: (id: string) =>
    apiClient.delete<ApiResponse<{ message: string }>>(`/saved-searches/${id}`),
};

// ===== CUSTOM FIELDS API =====
export const customFieldsApi = {
  getCustomFields: (params?: { category?: string; isActive?: boolean }) =>
    apiClient.get<ApiResponse<CustomField[]>>('/custom-fields', { params }),
  getCustomField: (id: string) =>
    apiClient.get<ApiResponse<CustomField>>(`/custom-fields/${id}`),
  createCustomField: (data: CreateCustomFieldInput) =>
    apiClient.post<ApiResponse<CustomField>>('/custom-fields', data),
  updateCustomField: (id: string, data: UpdateCustomFieldInput) =>
    apiClient.put<ApiResponse<CustomField>>(`/custom-fields/${id}`, data),
  deleteCustomField: (id: string) =>
    apiClient.delete<ApiResponse<void>>(`/custom-fields/${id}`),
};


// ===== INTEGRATIONS API =====
export const integrationsApi = {
  getIntegrations: () =>
    apiClient.get<ApiResponse<Integration[]>>('/integrations'),

  getIntegration: (id: string) =>
    apiClient.get<ApiResponse<Integration>>(`/integrations/${id}`),

  createIntegration: (data: CreateIntegrationInput) =>
    apiClient.post<ApiResponse<Integration>>('/integrations', data),

  updateIntegration: (id: string, data: UpdateIntegrationInput) =>
    apiClient.put<ApiResponse<Integration>>(`/integrations/${id}`, data),

  deleteIntegration: (id: string) =>
    apiClient.delete<ApiResponse<void>>(`/integrations/${id}`),

  testIntegration: (id: string) =>
    apiClient.post<ApiResponse<IntegrationTestResult>>(
      `/integrations/${id}/test`
    ),

  sendWebhook: (id: string, payload: WebhookPayload) =>
    apiClient.post<ApiResponse<{ success: boolean }>>(
      `/integrations/${id}/webhook`,
      payload
    ),
};

// ===== THEME SETTINGS API =====
export const themeSettingsApi = {
  getThemeSettings: () =>
    apiClient.get<ApiResponse<{
      id: string;
      primaryColor: string;
      logoUrl?: string;
      isActive: boolean;
    }>>('/admin/theme-settings'),

  getPublicThemeSettings: () =>
    apiClient.get<ApiResponse<{
      id: string;
      primaryColor: string;
      logoUrl?: string;
      isActive: boolean;
    }>>('/admin/public-theme-settings'),

  updateThemeSettings: (data: {
    primaryColor?: string | null;
    logoUrl?: string | null;
    logoData?: string | null;
  }) =>
    apiClient.patch<ApiResponse<{
      id: string;
      primaryColor: string;
      logoUrl?: string;
      logoData?: string;
      isActive: boolean;
    }>>('/admin/theme-settings', data),
};

export default apiClient;
