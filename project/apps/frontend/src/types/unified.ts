// ===== UNIFIED TYPES - SINGLE SOURCE OF TRUTH =====

// ===== ENUMS =====
export enum UserRole {
  END_USER = 'END_USER',
  SUPPORT_STAFF = 'SUPPORT_STAFF',
  SUPPORT_MANAGER = 'SUPPORT_MANAGER',
  ADMIN = 'ADMIN',
}

export enum TicketStatus {
  NEW = 'NEW',
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  ON_HOLD = 'ON_HOLD',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
  REOPENED = 'REOPENED',
}

export enum TicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum TicketCategory {
  HARDWARE = 'HARDWARE',
  SOFTWARE = 'SOFTWARE',
  NETWORK = 'NETWORK',
  ACCESS = 'ACCESS',
  OTHER = 'OTHER',
  CUSTOM = 'CUSTOM',
}

export enum TicketImpact {
  MINOR = 'MINOR',
  MODERATE = 'MODERATE',
  MAJOR = 'MAJOR',
  CRITICAL = 'CRITICAL',
}

export enum TicketUrgency {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  IMMEDIATE = 'IMMEDIATE',
}


export enum CustomFieldType {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  DATE = 'DATE',
  SELECT = 'SELECT',
  BOOLEAN = 'BOOLEAN',
}

// ===== CORE INTERFACES =====

// User interfaces
export interface User {
  id: string;
  email: string;
  name: string;
  roles: UserRole[];
  activeRole: UserRole;
  isActive: boolean;
  avatar: string | null;
  createdAt: string;
  updatedAt: string;
  openTicketCount?: number;
}

export interface CreateUserInput {
  email: string;
  name: string;
  password: string;
  roles: UserRole[];
  isActive?: boolean;
  avatar?: string;
}

export interface UpdateUserInput extends Partial<CreateUserInput> {
  isActive?: boolean;
}

export interface UserFilters {
  page?: number;
  limit?: number;
  search?: string;
  roles?: string[];
  isActive?: boolean;
}

export interface UserFormData {
  name: string;
  email: string;
  roles: string[];
  isActive: boolean;
  password?: string;
  confirmPassword?: string;
}

// Ticket interfaces
export interface Ticket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  categoryId: string;
  subcategoryId: string | null;
  category: {
    id: string;
    name: string;
    customName?: string; // Custom display name for categories
    description?: string;
  };
  subcategory?: {
    id: string;
    name: string;
    description?: string;
  };
  priority: TicketPriority;
  status: TicketStatus;
  impact: TicketImpact;
  urgency: TicketUrgency;
  requester: User;
  assignedTo?: User;
  dueDate?: string;
  resolution?: string;
  comments: Comment[];
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  responseTime?: number;
  resolutionTime?: number;
  customFields?: Record<string, string>;
  relatedTickets?: string[];
  workflowId?: string; // ID of the workflow this ticket belongs to
  workflowSnapshot?: {
    definition?: {
      nodes?: Array<{
        id: string;
        data?: { label?: string };
      }>;
      edges?: Array<{
        id: string;
        source: string;
        target: string;
        label?: string;
        data?: {
          roles?: string[];
          conditions?: string[];
          actions?: string[];
          isCreateTransition?: boolean;
        };
      }>;
    };
    status?: string;
  }; // Snapshot of workflow when ticket was created
  workflowVersion?: number; // Version of workflow when ticket was created
}

export interface CreateTicketInput {
  title: string;
  description: string;
  category: string; // Category ID
  subcategory?: string; // Subcategory ID (optional)
  priority?: TicketPriority;
  impact?: TicketImpact;
  urgency?: TicketUrgency;
  assignedToId?: string;
  relatedTickets?: string[];
  customFields?: Record<string, string | number | boolean>;
}

export interface UpdateTicketInput extends Partial<CreateTicketInput> {
  status?: TicketStatus;
  resolution?: string;
}

export type TicketViewType = 'all' | 'my' | 'assigned' | 'overdue';

export interface TicketFilters {
  page?: number;
  limit?: number;
  viewType?: TicketViewType; // 'all' (default), 'my', 'assigned', or 'overdue'
  search?: string;
  status?: TicketStatus[];
  priority?: TicketPriority[];
  category?: string[]; // Category IDs
  assignedToId?: string[]; // Array of assigned user IDs
  requesterId?: string[]; // Array of requester user IDs
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Comment interfaces
export interface Comment {
  id: string;
  ticketId: string;
  userId: string;
  user: User;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// Attachment interfaces
export interface Attachment {
  id: string;
  ticketId: string;
  filename: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  uploadedBy: User;
  createdAt: string;
}

// Custom Field interfaces
export interface CustomField {
  id: string;
  name: string;
  fieldType: CustomFieldType;
  options?: string[];
  isRequired: boolean;
  isActive: boolean;
  description?: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomFieldInput {
  name: string;
  fieldType: CustomFieldType;
  options?: string[];
  isRequired?: boolean;
  isActive?: boolean;
  description?: string;
  category?: string;
}

export interface UpdateCustomFieldInput
  extends Partial<CreateCustomFieldInput> {}

// Category interfaces
export interface Category {
  id: string;
  name: TicketCategory;
  customName?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface Subcategory {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: User;
}

// System Settings interfaces
export interface SystemSettings {
  id: string;
  siteName: string;
  siteDescription: string;
  supportEmail: string;
  supportPhone: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  language: string;
  theme: string;
  logoUrl?: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  notificationFrequency: string;
  autoAssignment: boolean;
  autoAssignTickets: boolean;
  autoCloseResolved: boolean;
  autoCloseDays: number;
  enableAuditLog: boolean;
  enableBackup: boolean;
  backupFrequency: string;
  maxFileSize: number;
  allowedFileTypes: string[];
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
  };
  passwordMinLength: number;
  requireTwoFactor: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
  twoFactorAuth: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  fromEmail: string;
  fromName: string;
  createdAt: string;
  updatedAt: string;
}

// Email Template types
export enum EmailTemplateType {
  TICKET_CREATED = 'TICKET_CREATED',
  TICKET_ASSIGNED = 'TICKET_ASSIGNED',
  STATUS_CHANGED = 'STATUS_CHANGED',
  COMMENT_ADDED = 'COMMENT_ADDED',
  AUTO_CLOSE_WARNING = 'AUTO_CLOSE_WARNING',
}

// Email Template interfaces
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html: string;
  type: EmailTemplateType;
  isActive: boolean;
  variables: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmailTemplateInput {
  name: string;
  subject: string;
  html: string;
  type: EmailTemplateType;
  isActive?: boolean;
  variables?: string[];
}

export interface UpdateEmailTemplateInput
  extends Partial<CreateEmailTemplateInput> {}

// API Response interfaces
export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Report interfaces
export interface ReportFilters {
  dateFrom?: string;
  dateTo?: string;
  category?: string[];
  status?: string[];
  priority?: string[];
  assignedTo?: string;
  userId?: string;
}

export interface TicketReport {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  averageResolutionTime: number;
  ticketsByCategory: Record<string, number>;
  ticketsByPriority: Record<string, number>;
  ticketsByStatus: Record<string, number>;
  responseTimeMetrics: {
    average: number;
    median: number;
    p95: number;
  };
  resolutionTimeMetrics: {
    average: number;
    median: number;
    p95: number;
  };
}

// Dashboard interfaces
export interface DashboardStats {
  totalTickets: number;
  openTickets: number;
  myTickets: number;
  assignedTickets: number;
  overdueTickets: number;
  recentActivity: Activity[];
}

export interface Activity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  user: User;
  ticket?: Ticket;
}

// Notification interfaces
export interface Notification {
  id: string;
  userId: string;
  ticketId?: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

// WebSocket interfaces
export type WebSocketMessageData =
  | { ticketId: string; changes: Partial<Ticket> }
  | { ticketId: string; comment: Comment }
  | Notification
  | Record<string, unknown>;

export interface WebSocketMessage {
  type: string;
  data: WebSocketMessageData;
  timestamp: string;
}

export interface TicketUpdateMessage extends WebSocketMessage {
  type: 'TICKET_UPDATE';
  data: { ticketId: string; changes: Partial<Ticket> };
}

export interface CommentMessage extends WebSocketMessage {
  type: 'COMMENT_ADDED';
  data: { ticketId: string; comment: Comment };
}

export interface NotificationMessage extends WebSocketMessage {
  type: 'NOTIFICATION';
  data: Notification;
}

// Form interfaces
export interface TicketFormData {
  title: string;
  description: string;
  category: TicketCategory;
  subcategory?: string;
  priority: TicketPriority;
  impact: TicketImpact;
  urgency: TicketUrgency;
  relatedTickets: string[];
  customFields: Record<string, string | number | boolean | string[]>;
}

export interface DynamicTicketFormValues {
  title: string;
  description: string;
  category: string; // Category ID
  subcategory?: string; // Subcategory ID (optional)
  priority: TicketPriority;
  impact: TicketImpact;
  urgency: TicketUrgency;
  attachments: FileWithPath[];
  customFields?: Record<string, string | number | boolean | string[]>;
  [key: string]: unknown; // For dynamic fields
}

// Utility types
export interface FileWithPath extends File {
  path?: string;
}

// Error interfaces
export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, unknown>;
}

// ===== EMAIL TEMPLATE TYPES =====
export interface EmailTemplatePreviewVariables extends Record<string, unknown> {
  user?: {
    name?: string;
    email?: string;
  };
  ticket?: {
    ticketNumber?: string;
    title?: string;
    priority?: string;
    status?: string;
    category?: string;
    createdAt?: string;
    updatedAt?: string;
    dueDate?: string;
    url?: string;
  };
  assignee?: {
    name?: string;
    email?: string;
  };
  requester?: {
    name?: string;
    email?: string;
  };
  oldStatus?: string;
  newStatus?: string;
  daysOverdue?: string;
}

export interface EmailTemplatePreview {
  subject: string;
  html: string;
  template: EmailTemplate;
}

// ===== DYNAMIC FORM TYPES =====
export enum DynamicFieldType {
  TEXT = 'text',
  TEXTAREA = 'textarea',
  SELECT = 'select',
  NUMBER = 'number',
}

export interface DynamicFieldOption {
  value: string;
  label: string;
}

export interface DynamicField {
  name: string;
  type: DynamicFieldType;
  label: string;
  required: boolean;
  placeholder?: string;
  options?: DynamicFieldOption[];
}

export interface DynamicFieldsResponse {
  fields: DynamicField[];
  subcategories: Subcategory[];
  category: Category;
}

export type DynamicValidationRules = Record<
  string,
  (value: unknown) => string | null
>;

// ===== SEARCH TYPES =====
export interface SearchCriteria {
  search: string;
  status: string[];
  priority: string[];
  category: string[];
  impact: string[];
  urgency: string[];
  assignedTo: string[];
  requester: string[];
  dateFrom: Date | null;
  dateTo: Date | null;
  tags: string[];
  customFields: Record<string, unknown>;
  // Additional numeric filters (hours)
  minResolutionHours?: number;
  maxResolutionHours?: number;
}

// ===== BULK OPERATIONS TYPES =====
export type BulkUpdateData =
  | { status: string; resolution?: string }
  | { assignedToId: string }
  | { priority: TicketPriority }
  | { message: string } // for notify operations
  | Record<string, never>; // for delete operations

// ===== FORM DATA TYPES =====
export interface EmailTemplateFormData {
  name: string;
  type: EmailTemplateType;
  subject: string;
  html: string;
  isActive: boolean;
}

// ===== API CLIENT TYPES =====
export interface CreateCommentInput {
  ticketId: string;
  content: string;
}

export interface UserDistribution {
  role: string;
  count: number;
  percentage: number;
}

export interface TicketStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  overdue: number;
  pending: number;
  new: number;
}


export interface CategoryStats {
  name: string;
  count: number;
  percentage: number;
}

export interface PriorityStats {
  priority: string;
  count: number;
  percentage: number;
}

export interface StatusStats {
  status: string;
  count: number;
  percentage: number;
}

export interface ReportData {
  ticketStats: TicketStats;
  categoryStats: CategoryStats[];
  priorityStats: PriorityStats[];
  statusStats: StatusStats[];
  userDistribution: UserDistribution[];
  recentTickets: Ticket[];
  overdueTickets: Ticket[];
  // Legacy properties for backward compatibility
  tickets?: {
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    byCategory: Record<string, number>;
  };
  teamPerformance?: TeamPerformanceData[];
  ticketTrendData?: Array<{
    month: string;
    tickets: number;
    resolved: number;
  }>;
  resolutionTimeData?: Array<{
    month: string;
    avg: number;
    target: number;
  }>;
}

export interface TeamPerformanceData {
  userId: string;
  userName: string;
  assignedTickets: number;
  resolvedTickets: number;
  avgResolutionTime: number;
  satisfactionRating: number;
}

export interface SystemMetrics {
  uptime: string;
  storageUsed: string;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  lastBackup: string;
  databaseSize: string;
  metrics: Array<{
    time: string;
    cpu: number;
    memory: number;
    disk: number;
  }>;
}

// ===== SAVED SEARCHES INTERFACES =====
export interface SavedSearch {
  id: string;
  name: string;
  description?: string;
  searchCriteria: string; // JSON string (matches backend database model)
  userId: string; // matches backend database model
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSavedSearchInput {
  name: string;
  description?: string;
  searchCriteria: Record<string, unknown>; // Object (matches backend DTO)
  isPublic?: boolean;
}

export interface UpdateSavedSearchInput
  extends Partial<CreateSavedSearchInput> {}

export interface PopularSavedSearch extends SavedSearch {
  usageCount: number;
}

// ===== ELASTICSEARCH INTERFACES =====
export interface ElasticsearchFilters {
  page?: number;
  limit?: number;
  status?: string[];
  priority?: string[];
  category?: string[];
  assignedTo?: string[];
  dateFrom?: string;
  dateTo?: string;
}

export interface ElasticsearchResult {
  data: Ticket[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  aggregations: Record<string, unknown>;
}

export interface SearchSuggestion {
  text: string;
  score: number;
}

export interface ElasticsearchHealth {
  status: string;
  cluster_name: string;
  version: {
    number: string;
  };
}

// ===== BACKUP INTERFACES =====
export interface Backup {
  id: string;
  filename: string;
  size: number;
  createdAt: string;
}

// ===== AUDIT LOGS INTERFACES =====
export interface AuditLog {
  id: string;
  userId: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  action: string;
  resource: string;
  resourceId?: string;
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface AuditLogsFilters {
  page?: number;
  limit?: number;
  userId?: string;
  action?: string;
  ticketId?: string;
  dateFrom?: string;
  dateTo?: string;
}

// ===== DYNAMIC FIELDS INTERFACES =====

// ===== ATTACHMENT INTERFACES =====
export interface AttachmentDownloadUrl {
  downloadUrl: string;
  expiresAt: string;
}

// ===== REPORT INTERFACES =====
export interface ReportFilters {
  dateFrom?: string;
  dateTo?: string;
  monthYear?: string[];
  status?: string[];
  priority?: string[];
  category?: string[];
  assignedTo?: string;
  department?: string[];
  role?: string[];
  requesterId?: string;
  userRole?: string;
}

// ===== SYSTEM INTERFACES =====
export interface SystemStats {
  totalTickets: number;
  openTickets: number;
  closedTickets: number;
  totalUsers: number;
  activeUsers: number;
  systemUptime: string;
  lastBackup: string;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    database: { status: string; responseTime: number };
    redis: { status: string; responseTime: number };
    elasticsearch: { status: string; responseTime: number };
    storage: { status: string; availableSpace: number };
  };
  lastChecked: string;
}

// ===== INTEGRATIONS TYPES =====
export interface Integration {
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
  createdAt: string;
  updatedAt: string;
}

export interface CreateIntegrationInput {
  name: string;
  type: Integration['type'];
  enabled?: boolean;
  config?: Record<string, unknown>;
  credentials?: Record<string, string>;
  webhookUrl?: string;
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  tenantId?: string;
}

export interface UpdateIntegrationInput {
  name?: string;
  type?: Integration['type'];
  enabled?: boolean;
  config?: Record<string, unknown>;
  credentials?: Record<string, string>;
  webhookUrl?: string;
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  tenantId?: string;
}

export interface IntegrationTestResult {
  success: boolean;
  message: string;
}

export interface WebhookPayload {
  event: string;
  data: Record<string, unknown>;
  timestamp: string;
  signature?: string;
}
