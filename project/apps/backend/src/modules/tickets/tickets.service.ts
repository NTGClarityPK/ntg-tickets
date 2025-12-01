import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import {
  TicketPriority,
  TicketImpact,
  Prisma,
} from '@prisma/client';
import { LoggerService } from '../../common/logger/logger.service';
import { RedisService } from '../../common/redis/redis.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ElasticsearchService } from '../elasticsearch/elasticsearch.service';
import { WebSocketGateway } from '../websocket/websocket.gateway';
import { SystemConfigService } from '../../common/config/system-config.service';
import { WorkflowExecutionService } from '../workflows/workflow-execution.service';
import { WorkflowsService } from '../workflows/workflows.service';
import { TicketResponseDto } from './dto/ticket-response.dto';
import { EmailNotificationService } from '../../common/email/email-notification.service';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { TenantsService } from '../tenants/tenants.service';

// Define proper types for ticket filters
interface TicketFilters {
  page?: number;
  limit?: number;
  cursor?: string;
  viewType?: 'all' | 'my' | 'assigned' | 'overdue';
  status?: string[];
  priority?: string[];
  category?: string[];
  assignedTo?: string[];
  assignedToId?: string[];
  includeUnassigned?: boolean;
  requesterId?: string[];
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface TicketUpdateData {
  status?: string;
  resolution?: string;
  title?: string;
  description?: string;
  priority?: TicketPriority;
  impact?: TicketImpact;
  categoryId?: string;
  subcategoryId?: string;
  assignedToId?: string;
  customFields?: Record<string, unknown>;
}

interface WorkflowDefinitionEdge {
  id: string;
  source: string;
  target: string;
  data?: {
    isCreateTransition?: boolean;
    label?: string;
  };
  label?: string;
}

interface WorkflowDefinitionNode {
  id: string;
  data?: {
    label?: string;
  };
}

interface WorkflowDefinition {
  edges?: WorkflowDefinitionEdge[];
  nodes?: WorkflowDefinitionNode[];
}

/**
 * Service for managing tickets in the NTG Ticket.
 *
 * This service provides comprehensive ticket management functionality including:
 * - Creating, reading, updating, and deleting tickets
 * - Status management and workflow enforcement
 * - Assignment and reassignment of tickets
 * - Integration with notification and search systems
 *
 * @example
 * ```typescript
 * const ticketsService = new TicketsService(prismaService, loggerService, redisService, notificationsService, elasticsearchService)
 * const ticket = await ticketsService.create(createTicketDto, userId, userRole)
 * ```
 */
@Injectable()
export class TicketsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
    private readonly redis: RedisService,
    private readonly notifications: NotificationsService,
    private readonly elasticsearch: ElasticsearchService,
    private readonly websocketGateway: WebSocketGateway,
    private readonly systemConfigService: SystemConfigService,
    private readonly workflowExecutionService: WorkflowExecutionService,
    private readonly workflowsService: WorkflowsService,
    private readonly emailNotificationService: EmailNotificationService,
    private readonly tenantContext: TenantContextService,
    @Inject(forwardRef(() => TenantsService))
    private readonly tenantsService: TenantsService
  ) {}

  /**
   * Creates a new ticket in the system.
   *
   * This method creates a new ticket with the provided data, validates the requester,
   * calculates priority information, and sends appropriate notifications.
   *
   * @param createTicketDto - The ticket data to create
   * @param userId - The ID of the user creating the ticket
   * @param userRole - The role of the user creating the ticket
   * @returns Promise<Ticket> - The created ticket with all relations
   *
   * @throws {NotFoundException} When the requester user is not found
   * @throws {BadRequestException} When validation fails
   *
   * @example
   * ```typescript
   * const ticket = await ticketsService.create({
   *   title: 'Unable to access email',
   *   description: 'I cannot access my email account',
   *   category: 'SOFTWARE',
   *   subcategory: 'email_client'
   * }, 'user-123', 'END_USER')
   * ```
   */
  async create(
    createTicketDto: CreateTicketDto,
    userId: string,
    userRole: string
  ) {
    this.logger.log(
      `Creating ticket for user ${userId} with role ${userRole}`,
      'TicketsService'
    );
    this.logger.log(
      `Ticket data: ${JSON.stringify(createTicketDto, null, 2)}`,
      'TicketsService'
    );

    // Validate user role can create tickets
    if (
      !['END_USER', 'SUPPORT_STAFF', 'SUPPORT_MANAGER', 'ADMIN'].includes(
        userRole
      )
    ) {
      this.logger.error(`Invalid user role: ${userRole}`, 'TicketsService');
      throw new BadRequestException('Invalid user role for ticket creation');
    }

    // Validate requester exists
    this.logger.log(`Looking up user with ID: ${userId}`, 'TicketsService');
    const requester = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!requester) {
      this.logger.error(`User not found with ID: ${userId}`, 'TicketsService');
      throw new NotFoundException('User not found');
    }
    this.logger.log(`Found user: ${requester.email}`, 'TicketsService');

    // Get tenant context
    const tenantId = this.tenantContext.requireTenantId();

    // Check if tenant has any categories - if not, initialize them
    const categoryCount = await this.prisma.category.count({
      where: { tenantId },
    });

    if (categoryCount === 0) {
      this.logger.log(
        `No categories found for tenant ${tenantId}, initializing default categories`,
        'TicketsService'
      );
      try {
        await this.tenantsService.initializeDefaultCategories(tenantId, userId);
        this.logger.log(
          `Successfully initialized default categories for tenant ${tenantId}`,
          'TicketsService'
        );
      } catch (error) {
        this.logger.error(
          `Failed to initialize categories for tenant ${tenantId}: ${error.message}`,
          'TicketsService'
        );
        // Continue anyway - maybe categories will be created manually
      }
    }

    // Validate category exists and belongs to tenant
    this.logger.log(
      `Looking up category with ID: ${createTicketDto.category} for tenant: ${tenantId}`,
      'TicketsService'
    );
    const category = await this.prisma.category.findFirst({
      where: { 
        id: createTicketDto.category,
        tenantId: tenantId,
      },
    });

    if (!category) {
      this.logger.error(
        `Category not found with ID: ${createTicketDto.category} for tenant: ${tenantId}`,
        'TicketsService'
      );
      throw new NotFoundException('Category not found or does not belong to your organization');
    }
    
    // Double-check tenant match (security check)
    if (category.tenantId !== tenantId) {
      this.logger.error(
        `Category ${createTicketDto.category} belongs to tenant ${category.tenantId}, but request is for tenant ${tenantId}`,
        'TicketsService'
      );
      throw new NotFoundException('Category not found or does not belong to your organization');
    }
    
    this.logger.log(`Found category: ${category.name}`, 'TicketsService');

    // Check if this category has subcategories - if not, initialize subcategories for all categories
    const subcategoryCount = await this.prisma.subcategory.count({
      where: {
        category: {
          tenantId: tenantId,
        },
      },
    });

    if (subcategoryCount === 0) {
      this.logger.log(
        `No subcategories found for tenant ${tenantId}, initializing default subcategories`,
        'TicketsService'
      );
      try {
        await this.tenantsService.initializeDefaultCategories(tenantId, userId);
        this.logger.log(
          `Successfully initialized default subcategories for tenant ${tenantId}`,
          'TicketsService'
        );
      } catch (error) {
        this.logger.error(
          `Failed to initialize subcategories for tenant ${tenantId}: ${error.message}`,
          'TicketsService'
        );
        // Continue anyway - maybe subcategories will be created manually
      }
    }

    // Validate subcategory exists and belongs to category (if provided)
    let subcategory = null;
    if (createTicketDto.subcategory) {
      this.logger.log(
        `Looking up subcategory with ID: ${createTicketDto.subcategory} for category: ${createTicketDto.category}`,
        'TicketsService'
      );
      // Subcategory must belong to the category, and category must belong to the tenant
      subcategory = await this.prisma.subcategory.findFirst({
        where: {
          id: createTicketDto.subcategory,
          categoryId: createTicketDto.category,
          category: {
            tenantId: tenantId,
          },
        },
      });

      if (!subcategory) {
        // Log available subcategories for debugging
        const availableSubcategories = await this.prisma.subcategory.findMany({
          where: {
            categoryId: createTicketDto.category,
            category: {
              tenantId: tenantId,
            },
          },
          select: { id: true, name: true },
        });
        
        this.logger.error(
          `Subcategory not found with ID: ${createTicketDto.subcategory} for category: ${createTicketDto.category} in tenant: ${tenantId}. Available subcategories: ${JSON.stringify(availableSubcategories)}`,
          'TicketsService'
        );
        throw new NotFoundException(
          'Subcategory not found or does not belong to this category in your organization'
        );
      }
      this.logger.log(`Found subcategory: ${subcategory.name}`, 'TicketsService');
    } else {
      this.logger.log('No subcategory provided, creating ticket without subcategory', 'TicketsService');
    }

    // Generate ticket number
    const ticketNumber = await this.generateTicketNumber();

    // Calculate due date based on priority (simple calculation, no SLA system)
    const dueDate = this.calculateDueDate(createTicketDto.priority);

    // Find category by ID (already validated above, but need for ticket creation)
    const ticketCategory = await this.prisma.category.findUnique({
      where: { id: createTicketDto.category },
    });

    if (!ticketCategory) {
      throw new BadRequestException('Invalid category');
    }

    // Auto-assign ticket if enabled and no specific assignee provided
    const assignedToId = createTicketDto.assignedToId;
    // Note: Auto-assignment is currently disabled by default
    // if (!assignedToId && this.systemConfigService.isAutoAssignEnabled()) {
    //   assignedToId = await this.autoAssignTicket(
    //     ticketCategory.id,
    //     ticketSubcategory.id
    //   );
    // }

    // Get default workflow and capture snapshot
    const {
      defaultWorkflowId,
      workflowSnapshot,
      workflowVersion,
      initialStatus,
    } = await this.resolveDefaultWorkflow();

    // Create ticket
    const ticket = await this.prisma.ticket.create({
      data: {
        tenantId,
        ticketNumber,
        title: createTicketDto.title,
        description: createTicketDto.description,
        categoryId: ticketCategory.id,
        subcategoryId: subcategory?.id || null,
        priority: createTicketDto.priority,
        impact: createTicketDto.impact,
        requesterId: userId,
        assignedToId: assignedToId,
        dueDate,
        status: initialStatus,
        workflowId: defaultWorkflowId,
        workflowSnapshot: workflowSnapshot as any, // Store snapshot for future use
        workflowVersion: workflowVersion,
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Handle custom fields if provided
    if (createTicketDto.customFields && Object.keys(createTicketDto.customFields).length > 0) {
      this.logger.log(`Processing custom fields: ${JSON.stringify(createTicketDto.customFields)}`, 'TicketsService');
      
      // Get all custom fields to map names to IDs
      const allCustomFields = await this.prisma.customField.findMany({
        where: { isActive: true },
      });

      // Create custom field values
      const customFieldEntries = Object.entries(createTicketDto.customFields)
        .map(([fieldName, fieldValue]) => {
          const customField = allCustomFields.find(cf => cf.name === fieldName);
          if (customField) {
            return {
              ticketId: ticket.id,
              customFieldId: customField.id,
              value: String(fieldValue),
            };
          }
          return null;
        })
        .filter(entry => entry !== null);

      if (customFieldEntries.length > 0) {
        await this.prisma.ticketCustomField.createMany({
          data: customFieldEntries,
        });

        this.logger.log(`Created ${customFieldEntries.length} custom field values`, 'TicketsService');
      }
    }

    // Index in Elasticsearch (ticket already has requester and assignedTo with minimal fields)
    try {
      await this.elasticsearch.indexTicket(ticket);
    } catch (error) {
      this.logger.error('Failed to index ticket in Elasticsearch', error);
    }

    // Send notification
    await this.notifications.create({
      userId,
      ticketId: ticket.id,
      type: 'TICKET_CREATED',
      title: 'Ticket Created',
      message: `Your ticket ${ticket.ticketNumber} has been created successfully.`,
    });

    // Emit WebSocket event (only basic fields needed)
    this.websocketGateway.emitTicketCreated({
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      title: ticket.title,
      priority: ticket.priority,
      status: ticket.status,
      requesterId: ticket.requesterId,
      assignedToId: ticket.assignedToId || undefined,
    });

    this.logger.log(`Ticket created: ${ticket.ticketNumber}`, 'TicketsService');
    
    // Return minimal response with only essential fields needed by frontend (id for redirect)
    return {
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      status: ticket.status,
    };
  }

  /**
   * Retrieves tickets with pagination and filtering.
   *
   * This method retrieves tickets based on user role and permissions, with support
   * for pagination, filtering, and searching.
   *
   * @param filters - Filter criteria for tickets
   * @param userId - The ID of the user requesting tickets
   * @param userRole - The role of the user requesting tickets
   * @returns Promise<PaginatedTickets> - Paginated list of tickets
   *
   * @example
   * ```typescript
   * const tickets = await ticketsService.findAll({
   *   page: 1,
   *   limit: 20,
   *   status: ['NEW', 'OPEN'],
   *   priority: ['HIGH', 'CRITICAL']
   * }, 'user-123', 'SUPPORT_STAFF')
   * ```
   */
  async findAll(filters: TicketFilters, userId: string, userRole: string) {
    this.logger.log(
      `Finding tickets for user ${userId} with role ${userRole}, viewType: ${filters.viewType || 'all'}`,
      'TicketsService'
    );

    // Filter by tenant
    const tenantId = this.tenantContext.getTenantId();
    const where: Prisma.TicketWhereInput = tenantId ? { tenantId } : {};

    // Apply viewType filter
    const viewType = filters.viewType || 'all';
    const now = new Date();
    
    if (viewType === 'my') {
      // My tickets: tickets created by OR assigned to the user
      where.OR = [
        { requesterId: userId },
        { assignedToId: userId },
      ];
    } else if (viewType === 'assigned') {
      // Assigned tickets: only tickets assigned to the user
      // Only support staff, managers, and admins can view assigned tickets
      if (!['SUPPORT_STAFF', 'SUPPORT_MANAGER', 'ADMIN'].includes(userRole)) {
        throw new BadRequestException(
          'Only support staff, managers, and admins can view assigned tickets'
        );
      }
      where.assignedToId = userId;
    } else if (viewType === 'overdue') {
      // Overdue tickets: dueDate < now, status not RESOLVED/CLOSED
      // Only support staff, managers, and admins can view overdue tickets
      if (!['SUPPORT_STAFF', 'SUPPORT_MANAGER', 'ADMIN'].includes(userRole)) {
        throw new BadRequestException(
          'Only support staff, managers, and admins can view overdue tickets'
        );
      }
      where.dueDate = { lt: now };
      where.status = { notIn: ['RESOLVED', 'CLOSED'] };
    }
    // For 'all' viewType, no additional filtering is applied (all tickets visible)

    // Apply filters
    if (filters.status && filters.status.length > 0) {
      const statusFilter = filters.status as (
        | 'NEW'
        | 'OPEN'
        | 'IN_PROGRESS'
        | 'ON_HOLD'
        | 'RESOLVED'
        | 'CLOSED'
        | 'REOPENED'
      )[];
      
      // For overdue viewType, filter out RESOLVED and CLOSED from user's status filter
      if (viewType === 'overdue') {
        const filteredStatuses = statusFilter.filter(s => s !== 'RESOLVED' && s !== 'CLOSED');
        if (filteredStatuses.length > 0) {
          const existingAnd = Array.isArray(where.AND) ? where.AND : (where.AND ? [where.AND] : []);
          where.AND = [
            ...existingAnd,
            { status: { in: filteredStatuses } },
            { status: { notIn: ['RESOLVED', 'CLOSED'] } },
          ];
          delete where.status;
        }
      } else {
        where.status = { in: statusFilter };
      }
    }

    if (filters.priority && filters.priority.length > 0) {
      where.priority = {
        in: filters.priority as ('LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL')[],
      };
    }

    if (filters.category && filters.category.length > 0) {
      where.categoryId = { in: filters.category };
    }

    if (filters.assignedTo && filters.assignedTo.length > 0) {
      where.assignedToId = { in: filters.assignedTo };
    }

    // Handle assignedToId filter with optional unassigned tickets
    if (filters.assignedToId && filters.assignedToId.length > 0) {
      if (filters.includeUnassigned) {
        // Include both assigned tickets (from the array) and unassigned tickets (null)
        // If there's already an OR condition (e.g., from viewType='my'), we need to nest it
        if (where.OR) {
          // Combine existing OR with the new assignedToId condition using AND
          const existingOr = where.OR;
          const existingAnd = Array.isArray(where.AND) ? where.AND : (where.AND ? [where.AND] : []);
          where.AND = [
            ...existingAnd,
            { OR: existingOr },
            {
              OR: [
                { assignedToId: { in: filters.assignedToId } },
                { assignedToId: null },
              ],
            },
          ];
          delete where.OR;
        } else {
          // No existing OR, we can add one directly
          where.OR = [
            { assignedToId: { in: filters.assignedToId } },
            { assignedToId: null },
          ];
        }
      } else {
        // Only assigned tickets - if there's an existing OR, we need to combine it
        if (where.OR) {
          const existingOr = where.OR;
          const existingAnd = Array.isArray(where.AND) ? where.AND : (where.AND ? [where.AND] : []);
          where.AND = [
            ...existingAnd,
            { OR: existingOr },
            { assignedToId: { in: filters.assignedToId } },
          ];
          delete where.OR;
        } else {
          where.assignedToId = { in: filters.assignedToId };
        }
      }
    } else if (filters.includeUnassigned) {
      // Only unassigned tickets - if there's an existing OR, we need to combine it
      if (where.OR) {
        const existingOr = where.OR;
        const existingAnd = Array.isArray(where.AND) ? where.AND : (where.AND ? [where.AND] : []);
        where.AND = [
          ...existingAnd,
          { OR: existingOr },
          { assignedToId: null },
        ];
        delete where.OR;
      } else {
        where.assignedToId = null;
      }
    }

    if (filters.requesterId && filters.requesterId.length > 0) {
      where.requesterId = { in: filters.requesterId };
    }

    // Handle search filter - combine with viewType OR if needed
    if (filters.search) {
      const searchConditions: Prisma.TicketWhereInput[] = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { ticketNumber: { contains: filters.search, mode: 'insensitive' } },
      ];

      // If viewType is 'my', we need to combine the OR conditions
      if (viewType === 'my' && where.OR) {
        // Wrap both conditions in AND: (user filter) AND (search filter)
        where.AND = [
          { OR: where.OR }, // My tickets condition
          { OR: searchConditions }, // Search condition
        ];
        delete where.OR;
      } else {
        // For other viewTypes, just use OR for search
        where.OR = searchConditions;
      }
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.createdAt.lte = new Date(filters.dateTo);
      }
    }

    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100);
    const skip = (page - 1) * limit;

    // Determine orderBy based on viewType
    let orderBy: Prisma.TicketOrderByWithRelationInput;
    if (viewType === 'overdue') {
      // Order overdue tickets by dueDate ascending (most urgent first)
      orderBy = { dueDate: 'asc' };
    } else {
      // Default ordering by updatedAt descending
      orderBy = { updatedAt: 'desc' };
    }

    const [tickets, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        include: {
          requester: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              customName: true,
              description: true,
            },
          },
          subcategory: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
          _count: {
            select: {
              comments: true,
              attachments: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.ticket.count({ where }),
    ]);

    return {
      data: tickets.map(ticket => this.transformTicket(ticket)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Retrieves a single ticket by ID.
   *
   * This method retrieves a ticket by its ID, with role-based access control
   * to ensure users can only access tickets they have permission to view.
   *
   * @param id - The ID of the ticket to retrieve
   * @param userId - The ID of the user requesting the ticket
   * @param userRole - The role of the user requesting the ticket
   * @returns Promise<Ticket> - The requested ticket with all relations
   *
   * @throws {NotFoundException} When the ticket is not found
   * @throws {ForbiddenException} When the user doesn't have permission to view the ticket
   *
   * @example
   * ```typescript
   * const ticket = await ticketsService.findOne('ticket-123', 'user-123', 'END_USER')
   * ```
   */
  async findOne(id: string, userId: string, userRole: string) {
    this.logger.log(
      `Finding ticket ${id} for user ${userId}`,
      'TicketsService'
    );

    // Filter by tenant
    const tenantId = this.tenantContext.getTenantId();
    const ticket = await this.prisma.ticket.findFirst({
      where: { id, ...(tenantId ? { tenantId } : {}) },
      include: {
        requester: true,
        assignedTo: true,
        category: true,
        subcategory: true,
        comments: {
          include: {
            user: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        attachments: {
          include: {
            uploader: true,
          },
        },
        history: {
          include: {
            user: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        customFields: {
          include: {
            customField: true,
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // NOTE: All roles can view all tickets now (per requirements)
    // The "My Tickets" page handles filtering for tickets created by or assigned to the user
    // No permission check needed here - everyone can view all tickets

    // Transform custom fields to a simple key-value object
    const customFieldsObject: Record<string, string> = {};
    if (ticket.customFields) {
      ticket.customFields.forEach((ticketCustomField) => {
        if (ticketCustomField.customField) {
          customFieldsObject[ticketCustomField.customField.name] = ticketCustomField.value;
        }
      });
    }

    // Transform and return ticket with only necessary fields
    const transformedTicket = this.transformTicket({
      ...ticket,
      customFields: customFieldsObject,
    });
    return transformedTicket;
  }

  /**
   * Updates an existing ticket.
   *
   * This method updates a ticket with the provided data, validates permissions,
   * tracks changes in history, and sends appropriate notifications.
   *
   * @param id - The ID of the ticket to update
   * @param updateTicketDto - The data to update the ticket with
   * @param userId - The ID of the user updating the ticket
   * @param userRole - The role of the user updating the ticket
   * @returns Promise<Ticket> - The updated ticket with all relations
   *
   * @throws {NotFoundException} When the ticket is not found
   * @throws {ForbiddenException} When the user doesn't have permission to update the ticket
   *
   * @example
   * ```typescript
   * const ticket = await ticketsService.update('ticket-123', {
   *   title: 'Updated title',
   *   priority: 'HIGH'
   * }, 'user-123', 'SUPPORT_STAFF')
   * ```
   */
  async update(
    id: string,
    updateTicketDto: UpdateTicketDto,
    userId: string,
    userRole: string
  ) {
    this.logger.log(
      `Updating ticket ${id} by user ${userId}`,
      'TicketsService'
    );

    // Filter by tenant
    const tenantId = this.tenantContext.getTenantId();
    const existingTicket = await this.prisma.ticket.findFirst({
      where: { id, ...(tenantId ? { tenantId } : {}) },
    });

    if (!existingTicket) {
      throw new NotFoundException('Ticket not found');
    }

    // Track changes for history
    const changes = this.trackChanges(
      existingTicket,
      updateTicketDto as Record<string, unknown>
    );

    // Extract fields that should not be updated directly
    const {
      category,
      subcategory,
      assignedToId,
      relatedTickets,
      ...baseUpdateData
    } = updateTicketDto;

    // Build the complete update data object
    const updateData: TicketUpdateData = { ...baseUpdateData };

    // Handle category and subcategory updates if provided
    if (category && subcategory) {
      updateData.categoryId = category;
      updateData.subcategoryId = subcategory;
    }

    // Handle assignment if provided
    if (assignedToId !== undefined) {
      updateData.assignedToId = assignedToId;
    }

    const ticket = await this.prisma.ticket.update({
      where: { id },
      data: updateData,
      include: {
        requester: true,
        assignedTo: true,
        category: true,
        subcategory: true,
        comments: {
          include: {
            user: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        attachments: {
          include: {
            uploader: true,
          },
        },
      },
    });

    // Handle related tickets if provided
    if (relatedTickets && Array.isArray(relatedTickets)) {
      // Remove existing relations
      await this.prisma.ticketRelation.deleteMany({
        where: { ticketId: id },
      });

      // Create new relations
      if (relatedTickets.length > 0) {
        await this.prisma.ticketRelation.createMany({
          data: relatedTickets.map((relatedTicketId: string) => ({
            ticketId: id,
            relatedTicketId,
            relationType: 'related',
          })),
        });
      }
    }

    // Record changes in history
    if (changes.length > 0) {
      await this.prisma.ticketHistory.createMany({
        data: changes.map(change => ({
          ticketId: id,
          userId,
          fieldName: change.field,
          oldValue: change.oldValue,
          newValue: change.newValue,
        })),
      });
    }

    // Update in Elasticsearch
    try {
      await this.elasticsearch.updateTicket(ticket);
    } catch (error) {
      this.logger.error('Failed to update ticket in Elasticsearch', error);
    }

    // Send notification if status changed
    if (
      updateTicketDto.status &&
      updateTicketDto.status !== existingTicket.status
    ) {
      await this.notifications.create({
        userId: ticket.requesterId,
        ticketId: ticket.id,
        type: 'TICKET_STATUS_CHANGED',
        title: 'Ticket Status Updated',
        message: `Your ticket ${ticket.ticketNumber} status has been changed to ${updateTicketDto.status}.`,
      });
    }

    // Emit WebSocket event
    this.websocketGateway.emitTicketUpdated(ticket, userId);

    this.logger.log(`Ticket updated: ${ticket.ticketNumber}`, 'TicketsService');
    return this.transformTicket(ticket);
  }

  /**
   * Deletes a ticket from the system.
   *
   * This method permanently deletes a ticket and all its related data,
   * with appropriate permission checks and cleanup.
   *
   * @param id - The ID of the ticket to delete
   * @param userId - The ID of the user deleting the ticket
   * @param userRole - The role of the user deleting the ticket
   * @returns Promise<void>
   *
   * @throws {NotFoundException} When the ticket is not found
   * @throws {ForbiddenException} When the user doesn't have permission to delete the ticket
   *
   * @example
   * ```typescript
   * await ticketsService.remove('ticket-123', 'user-123', 'ADMIN')
   * ```
   */
  async remove(id: string, userId: string, userRole: string) {
    this.logger.log(
      `Deleting ticket ${id} by user ${userId}`,
      'TicketsService'
    );

    // Filter by tenant
    const tenantId = this.tenantContext.getTenantId();
    const ticket = await this.prisma.ticket.findFirst({
      where: { id, ...(tenantId ? { tenantId } : {}) },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // Check permissions
    if (userRole === 'END_USER' && ticket.requesterId !== userId) {
      throw new ForbiddenException(
        'Access denied: You can only delete your own tickets'
      );
    }

    // Delete from Elasticsearch
    try {
      await this.elasticsearch.deleteTicket(id);
    } catch (error) {
      this.logger.error('Failed to delete ticket from Elasticsearch', error);
    }

    // Delete ticket (cascade will handle related records)
    await this.prisma.ticket.delete({
      where: { id },
    });

    this.logger.log(`Ticket deleted: ${ticket.ticketNumber}`, 'TicketsService');
  }

  /**
   * Bulk delete multiple tickets
   * @param ids Array of ticket IDs to delete
   * @param userId ID of the user performing the deletion
   * @param userRole Role of the user performing the deletion
   * @returns Object with deleted count and failed IDs
   * @example
   * ```typescript
   * await ticketsService.bulkRemove(['ticket-1', 'ticket-2'], 'user-123', 'ADMIN')
   * ```
   */
  async bulkRemove(ids: string[], userId: string, userRole: string) {
    this.logger.log(
      `Bulk deleting ${ids.length} tickets by user ${userId}`,
      'TicketsService'
    );

    if (!ids || ids.length === 0) {
      throw new BadRequestException('No ticket IDs provided');
    }

    // Filter by tenant
    const tenantId = this.tenantContext.getTenantId();

    // Fetch all tickets to check permissions
    const tickets = await this.prisma.ticket.findMany({
      where: { id: { in: ids }, ...(tenantId ? { tenantId } : {}) },
      select: { id: true, requesterId: true, ticketNumber: true },
    });

    if (tickets.length === 0) {
      throw new NotFoundException('No tickets found');
    }

    // Check permissions for each ticket
    const unauthorizedTickets: string[] = [];
    if (userRole === 'END_USER') {
      tickets.forEach(ticket => {
        if (ticket.requesterId !== userId) {
          unauthorizedTickets.push(ticket.ticketNumber);
        }
      });
    }

    if (unauthorizedTickets.length > 0) {
      throw new ForbiddenException(
        `Access denied: You can only delete your own tickets. Unauthorized tickets: ${unauthorizedTickets.join(', ')}`
      );
    }

    const ticketIds = tickets.map(t => t.id);
    const deletedTicketNumbers = tickets.map(t => t.ticketNumber);

    // Delete from Elasticsearch
    const elasticsearchErrors: string[] = [];
    for (const id of ticketIds) {
      try {
        await this.elasticsearch.deleteTicket(id);
      } catch (error) {
        this.logger.error(
          `Failed to delete ticket ${id} from Elasticsearch`,
          error
        );
        elasticsearchErrors.push(id);
      }
    }

    // Bulk delete tickets (cascade will handle related records)
    const deleteResult = await this.prisma.ticket.deleteMany({
      where: { id: { in: ticketIds } },
    });

    this.logger.log(
      `Bulk deleted ${deleteResult.count} tickets: ${deletedTicketNumbers.join(', ')}`,
      'TicketsService'
    );

    if (elasticsearchErrors.length > 0) {
      this.logger.warn(
        `Some tickets were not deleted from Elasticsearch: ${elasticsearchErrors.join(', ')}`,
        'TicketsService'
      );
    }

    return {
      deletedCount: deleteResult.count,
      deletedTicketNumbers,
      elasticsearchErrors,
    };
  }

  async updateStatus(
    id: string,
    status: string,
    resolution: string | undefined,
    userId: string,
    userRole: string,
    comment?: string,
  ) {
    this.logger.log(
      `Updating status of ticket ${id} to ${status} by user ${userId}`,
      'TicketsService'
    );

    // Filter by tenant
    const tenantId = this.tenantContext.getTenantId();

    // Get the current ticket to check permissions
    const ticket = await this.prisma.ticket.findFirst({
      where: { id, ...(tenantId ? { tenantId } : {}) },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // Permission checks are now handled by the workflow execution service
    // No hardcoded role restrictions - all rules derived from active workflow

    // Ensure ticket has a workflow assigned (use default if missing)
    if (!ticket.workflowId) {
      const defaultWorkflow = await this.workflowsService.findDefault();
      if (defaultWorkflow) {
        await this.prisma.ticket.update({
          where: { id },
          data: { workflowId: defaultWorkflow.id },
        });
        ticket.workflowId = defaultWorkflow.id;
        this.logger.log(
          `Assigned default workflow to ticket ${ticket.ticketNumber}`,
          'TicketsService'
        );
      }
    }

    // Use workflow execution service if a workflow is assigned
    if (ticket.workflowId) {
      try {
        const result = await this.workflowExecutionService.executeTicketTransition(
          id,
          status,
          userId,
          userRole as any, // Cast to UserRole enum
          comment,
          resolution,
        );
        
        // Update in Elasticsearch
        try {
          await this.elasticsearch.updateTicket(result.ticket);
        } catch (error) {
          this.logger.error('Failed to update ticket in Elasticsearch', error);
        }

        this.logger.log(
          `Ticket status updated via workflow: ${ticket.ticketNumber} to ${status}`,
          'TicketsService'
        );
        
        return this.transformTicket(result.ticket);
      } catch (error) {
        // If it's a validation error (BadRequestException) or permission error (ForbiddenException),
        // we should propagate it to the user, not fall back to legacy validation
        if (error instanceof BadRequestException || error instanceof ForbiddenException) {
          this.logger.error(`Workflow validation failed: ${error.message}`);
          throw error; // Rethrow to show user the validation error
        }
        
        // Only fall back to legacy validation for technical errors
        this.logger.error('Workflow execution encountered technical error, falling back to legacy validation', error);
        // Fall through to legacy validation
      }
    }

    // Legacy validation and update (for tickets without workflows)
    // Note: Status transition validation is now handled by the workflow system
    // The frontend checks workflow permissions before allowing transitions

    const updateData: Prisma.TicketUpdateInput = {
      status,
      updatedAt: new Date(),
    };

    if (resolution) {
      updateData.resolution = resolution;
    }

    if (status === 'CLOSED') {
      updateData.closedAt = new Date();
    }

    const updatedTicket = await this.prisma.ticket.update({
      where: { id },
      data: updateData,
      include: {
        requester: true,
        assignedTo: true,
        category: true,
        subcategory: true,
      },
    });

    // Record in history
    await this.prisma.ticketHistory.create({
      data: {
        ticketId: id,
        userId,
        fieldName: 'status',
        oldValue: ticket.status,
        newValue: status,
      },
    });

    // Update in Elasticsearch
    try {
      await this.elasticsearch.updateTicket(updatedTicket);
    } catch (error) {
      this.logger.error('Failed to update ticket in Elasticsearch', error);
    }

    // Send notification
    await this.notifications.create({
      userId: ticket.requesterId,
      ticketId: ticket.id,
      type: 'TICKET_STATUS_CHANGED',
      title: 'Ticket Status Updated',
      message: `Your ticket ${ticket.ticketNumber} status has been changed to ${status}.`,
    });

    this.logger.log(
      `Ticket status updated: ${ticket.ticketNumber} to ${status}`,
      'TicketsService'
    );
    return this.transformTicket(updatedTicket);
  }

  async assignTicket(
    id: string,
    assignedToId: string,
    userId: string,
    userRole: string
  ) {
    this.logger.log(
      `Assigning ticket ${id} to user ${assignedToId} by user ${userId}`,
      'TicketsService'
    );

    // Validate user role can assign tickets
    if (userRole !== 'SUPPORT_MANAGER') {
      this.logger.error(
        `User ${userId} with role ${userRole} cannot assign tickets`,
        'TicketsService'
      );
      throw new BadRequestException(
        'Only support managers can assign tickets'
      );
    }

    // Validate assignedToId is provided
    if (!assignedToId || assignedToId.trim() === '') {
      this.logger.error(
        `Empty assignedToId provided by user ${userId}`,
        'TicketsService'
      );
      throw new BadRequestException('Assignee ID is required');
    }

    // Filter by tenant
    const tenantId = this.tenantContext.getTenantId();
    const ticket = await this.prisma.ticket.findFirst({
      where: { id, ...(tenantId ? { tenantId } : {}) },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const assignee = await this.prisma.user.findUnique({
      where: { id: assignedToId },
    });

    if (!assignee) {
      throw new NotFoundException('Assignee not found');
    }

    if (
      !assignee.roles.some(role =>
        ['SUPPORT_STAFF', 'SUPPORT_MANAGER', 'ADMIN'].includes(role)
      )
    ) {
      this.logger.error(
        `Assignee ${assignedToId} has invalid roles ${assignee.roles.join(', ')}`,
        'TicketsService'
      );
      throw new BadRequestException('Assignee must be a support staff member');
    }

    this.logger.log(
      `Updating ticket ${id} with assignee ${assignedToId}`,
      'TicketsService'
    );

    let updatedTicket;
    try {
      updatedTicket = await this.prisma.ticket.update({
        where: { id },
        data: {
          assignedToId,
          updatedAt: new Date(),
        },
        include: {
          requester: true,
          assignedTo: true,
          category: true,
          subcategory: true,
        },
      });

      this.logger.log(`Ticket ${id} updated successfully`, 'TicketsService');
    } catch (error) {
      this.logger.error(
        `Error updating ticket ${id}: ${error.message}`,
        'TicketsService'
      );
      throw error;
    }

    // Record in history
    try {
      await this.prisma.ticketHistory.create({
        data: {
          ticketId: id,
          userId,
          fieldName: 'assignedToId',
          oldValue: ticket.assignedToId,
          newValue: assignedToId,
        },
      });
      this.logger.log(`History recorded for ticket ${id}`, 'TicketsService');
    } catch (error) {
      this.logger.error(
        `Error recording history for ticket ${id}: ${error.message}`,
        'TicketsService'
      );
      // Don't throw here, just log the error
    }

    // Update in Elasticsearch
    try {
      await this.elasticsearch.updateTicket(updatedTicket);
    } catch (error) {
      this.logger.error('Failed to update ticket in Elasticsearch', error);
    }

    // Send notifications
    try {
      await Promise.all([
        // Notify requester
        this.notifications.create({
          userId: ticket.requesterId,
          ticketId: ticket.id,
          type: 'TICKET_ASSIGNED',
          title: 'Ticket Assigned',
          message: `Your ticket ${ticket.ticketNumber} has been assigned to ${assignee.name}.`,
        }),
        // Notify assignee
        this.notifications.create({
          userId: assignedToId,
          ticketId: ticket.id,
          type: 'TICKET_ASSIGNED',
          title: 'New Ticket Assignment',
          message: `You have been assigned ticket ${ticket.ticketNumber}.`,
        }),
      ]);
      this.logger.log(`Notifications sent for ticket ${id}`, 'TicketsService');

      // Send email notification (once for both assignee and requester)
      const requester = await this.prisma.user.findUnique({
        where: { id: ticket.requesterId },
        select: { id: true, name: true, email: true },
      });
      if (requester) {
        await this.emailNotificationService.sendTicketAssignedEmail(
          updatedTicket,
          assignee,
          requester
        );
      }
    } catch (error) {
      this.logger.error(
        `Error sending notifications for ticket ${id}: ${error.message}`,
        'TicketsService'
      );
      // Don't throw here, just log the error
    }

    // Emit WebSocket event
    try {
      this.websocketGateway.emitTicketAssigned(updatedTicket);
      this.logger.log(
        `WebSocket event emitted for ticket ${id}`,
        'TicketsService'
      );
    } catch (error) {
      this.logger.error(
        `Error emitting WebSocket event for ticket ${id}: ${error.message}`,
        'TicketsService'
      );
      // Don't throw here, just log the error
    }

    this.logger.log(
      `Ticket assigned: ${ticket.ticketNumber} to ${assignee.name}`,
      'TicketsService'
    );
    return this.transformTicket(updatedTicket);
  }

  private async generateTicketNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `TKT-${year}-`;

    // Use a persistent counter stored in SystemSettings to prevent ID reuse after deletion
    // This counter only increments and never decreases, ensuring unique ticket numbers
    const COUNTER_KEY = 'ticket_number_counter';
    
    try {
      // Get the current counter value from SystemSettings
      let counterValue = await this.systemConfigService.getSetting(COUNTER_KEY);
      let nextNumber: number;

      // Always check both counter and existing tickets to ensure we never reuse a number
      // This prevents ID reuse even if tickets are deleted
      const allTickets = await this.prisma.ticket.findMany({
        select: {
          ticketNumber: true,
        },
      });

      let maxNumberFromTickets = 0;
      const ticketNumberRegex = /^TKT-\d{4}-(\d+)$/;
      
      for (const ticket of allTickets) {
        const match = ticket.ticketNumber.match(ticketNumberRegex);
        if (match) {
          const number = parseInt(match[1], 10);
          if (!isNaN(number) && number > maxNumberFromTickets) {
            maxNumberFromTickets = number;
          }
        }
      }

      if (!counterValue || counterValue === null || counterValue === '') {
        // Counter doesn't exist, initialize it from existing tickets
        this.logger.log('Ticket number counter not found, initializing from existing tickets', 'TicketsService');
        nextNumber = maxNumberFromTickets + 1;
      } else {
        // Counter exists, use the higher of counter value or max from tickets
        // This ensures we never reuse a number even if counter is out of sync
        const currentValue = typeof counterValue === 'string' 
          ? parseInt(counterValue, 10) 
          : Number(counterValue);
        
        if (isNaN(currentValue)) {
          this.logger.warn('Invalid counter value, using max from tickets', 'TicketsService');
          nextNumber = maxNumberFromTickets + 1;
        } else {
          // Use whichever is higher: counter value or max from existing tickets
          nextNumber = Math.max(currentValue, maxNumberFromTickets) + 1;
          
          // If counter was lower than max from tickets, log a warning
          if (currentValue < maxNumberFromTickets) {
            this.logger.warn(
              `Counter value (${currentValue}) is lower than max ticket number (${maxNumberFromTickets}). Using ${maxNumberFromTickets + 1} to prevent ID reuse.`,
              'TicketsService'
            );
          }
        }
      }

      // Atomically update the counter in SystemSettings
      await this.systemConfigService.updateSetting(COUNTER_KEY, nextNumber.toString());

      const ticketNumber = `${prefix}${nextNumber.toString().padStart(6, '0')}`;

      // Double-check uniqueness to prevent race conditions
      const existing = await this.prisma.ticket.findUnique({
        where: { ticketNumber },
      });

      if (existing) {
        // If somehow the ticket number exists (race condition), recursively try the next one
        // This handles race conditions where multiple tickets are created simultaneously
        this.logger.warn(
          `Ticket number ${ticketNumber} already exists, trying next number`,
          'TicketsService'
        );
        return this.generateTicketNumberWithRetry(prefix, nextNumber + 1, 10);
      }

      this.logger.log(`Generated ticket number: ${ticketNumber} (counter: ${nextNumber})`, 'TicketsService');
      return ticketNumber;
    } catch (error) {
      this.logger.error('Error generating ticket number from counter, falling back to max-based method', error);
      
      // Fallback to the old method if SystemSettings fails
      const allTickets = await this.prisma.ticket.findMany({
        select: {
          ticketNumber: true,
        },
        orderBy: {
          ticketNumber: 'desc',
        },
        take: 1,
      });

      let maxNumber = 0;
      const ticketNumberRegex = /^TKT-\d{4}-(\d+)$/;
      
      if (allTickets.length > 0) {
        const match = allTickets[0].ticketNumber.match(ticketNumberRegex);
        if (match) {
          maxNumber = parseInt(match[1], 10) || 0;
        }
      }

      const nextNumber = maxNumber + 1;
      const ticketNumber = `${prefix}${nextNumber.toString().padStart(6, '0')}`;
      
      return ticketNumber;
    }
  }

  private async generateTicketNumberWithRetry(
    prefix: string,
    startNumber: number,
    maxRetries: number
  ): Promise<string> {
    const COUNTER_KEY = 'ticket_number_counter';
    
    for (let i = 0; i < maxRetries; i++) {
      const candidate = `${prefix}${startNumber.toString().padStart(6, '0')}`;
      const existing = await this.prisma.ticket.findUnique({
        where: { ticketNumber: candidate },
      });

      if (!existing) {
        // Update the counter to reflect the number we're using
        // This ensures the counter stays in sync even in race conditions
        try {
          await this.systemConfigService.updateSetting(COUNTER_KEY, startNumber.toString());
        } catch (error) {
          this.logger.warn(
            `Failed to update counter after retry, but ticket number ${candidate} is valid`,
            'TicketsService'
          );
        }
        return candidate;
      }

      startNumber++;
    }

    // If we've exhausted retries, throw an error
    throw new Error(
      `Unable to generate unique ticket number after ${maxRetries} attempts`
    );
  }


  /**
   * Calculate due date based on priority (simple calculation)
   */
  private calculateDueDate(priority: TicketPriority): Date {
    const now = new Date();
    let hoursToAdd = 72; // Default: 3 days

    switch (priority) {
      case 'CRITICAL':
        hoursToAdd = 4; // 4 hours
        break;
      case 'HIGH':
        hoursToAdd = 8; // 8 hours
        break;
      case 'MEDIUM':
        hoursToAdd = 48; // 2 days
        break;
      case 'LOW':
        hoursToAdd = 168; // 7 days
        break;
    }

    return new Date(now.getTime() + hoursToAdd * 60 * 60 * 1000);
  }

  // DEPRECATED: This method is no longer used. Status transitions are now controlled by the workflow system.
  // Keeping it commented out for reference in case of rollback needs.
  // private isValidStatusTransition(
  //   currentStatus: TicketStatus,
  //   newStatus: TicketStatus
  // ): boolean {
  //   const validTransitions: Record<TicketStatus, TicketStatus[]> = {
  //     ['NEW']: ['OPEN', 'CLOSED'],
  //     ['OPEN']: [
  //       'IN_PROGRESS',
  //       TicketStatus.ON_HOLD,
  //       'CLOSED',
  //     ],
  //     ['IN_PROGRESS']: [
  //       TicketStatus.ON_HOLD,
  //       'RESOLVED',
  //       'CLOSED',
  //     ],
  //     [TicketStatus.ON_HOLD]: ['IN_PROGRESS', 'CLOSED'],
  //     ['RESOLVED']: ['CLOSED', 'REOPENED'],
  //     ['CLOSED']: ['REOPENED'],
  //     ['REOPENED']: [
  //       'OPEN',
  //       'IN_PROGRESS',
  //       'CLOSED',
  //     ],
  //   };
  //   return validTransitions[currentStatus]?.includes(newStatus) || false;
  // }

  /**
   * Get tickets created by or assigned to the current user (for "My Tickets" page)
   */
  async findMyTickets(userId: string, userRole: string) {
    this.logger.log(
      `Getting "My Tickets" for user ${userId} with role ${userRole}`,
      'TicketsService'
    );

    // Filter by tenant
    const tenantId = this.tenantContext.getTenantId();

    // Show tickets created by OR assigned to the user
    const tickets = await this.prisma.ticket.findMany({
      where: {
        ...(tenantId ? { tenantId } : {}),
        OR: [
          { requesterId: userId },
          { assignedToId: userId },
        ],
      },
      include: {
        requester: true,
        assignedTo: true,
        category: true,
        subcategory: true,
        _count: {
          select: {
            comments: true,
            attachments: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return tickets.map(ticket => this.transformTicket(ticket));
  }

  async getMyTickets(userId: string, filters: TicketFilters) {
    this.logger.log(`Getting tickets for user ${userId}`, 'TicketsService');

    // Filter by tenant
    const tenantId = this.tenantContext.getTenantId();
    const where: Prisma.TicketWhereInput = {
      ...(tenantId ? { tenantId } : {}),
      requesterId: userId,
    };

    // Apply filters
    if (filters.status && filters.status.length > 0) {
      where.status = {
        in: filters.status as (
          | 'NEW'
          | 'OPEN'
          | 'IN_PROGRESS'
          | 'ON_HOLD'
          | 'RESOLVED'
          | 'CLOSED'
          | 'REOPENED'
        )[],
      };
    }

    if (filters.priority && filters.priority.length > 0) {
      where.priority = {
        in: filters.priority as ('LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL')[],
      };
    }

    if (filters.category && filters.category.length > 0) {
      where.categoryId = { in: filters.category };
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { ticketNumber: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.createdAt.lte = new Date(filters.dateTo);
      }
    }

    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100);
    const skip = (page - 1) * limit;

    const [tickets, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        include: {
          requester: true,
          assignedTo: true,
          category: true,
          subcategory: true,
          _count: {
            select: {
              comments: true,
              attachments: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.ticket.count({ where }),
    ]);

    return {
      data: tickets.map(ticket => this.transformTicket(ticket)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAssignedTickets(userId: string, filters: TicketFilters) {
    this.logger.log(
      `Getting assigned tickets for user ${userId}`,
      'TicketsService'
    );

    // Filter by tenant
    const tenantId = this.tenantContext.getTenantId();
    const where: Prisma.TicketWhereInput = {
      ...(tenantId ? { tenantId } : {}),
      assignedToId: userId,
    };

    // Apply filters
    if (filters.status && filters.status.length > 0) {
      where.status = {
        in: filters.status as (
          | 'NEW'
          | 'OPEN'
          | 'IN_PROGRESS'
          | 'ON_HOLD'
          | 'RESOLVED'
          | 'CLOSED'
          | 'REOPENED'
        )[],
      };
    }

    if (filters.priority && filters.priority.length > 0) {
      where.priority = {
        in: filters.priority as ('LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL')[],
      };
    }

    if (filters.category && filters.category.length > 0) {
      where.categoryId = { in: filters.category };
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { ticketNumber: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.createdAt.lte = new Date(filters.dateTo);
      }
    }

    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100);
    const skip = (page - 1) * limit;

    const [tickets, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        include: {
          requester: true,
          assignedTo: true,
          category: true,
          subcategory: true,
          _count: {
            select: {
              comments: true,
              attachments: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.ticket.count({ where }),
    ]);

    // Debug logging removed for production

    return {
      data: tickets.map(ticket => this.transformTicket(ticket)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOverdueTickets() {
    this.logger.log('Getting overdue tickets', 'TicketsService');

    // Filter by tenant
    const tenantId = this.tenantContext.getTenantId();
    const now = new Date();
    const tickets = await this.prisma.ticket.findMany({
      where: {
        ...(tenantId ? { tenantId } : {}),
        dueDate: {
          lt: now,
        },
        status: {
          notIn: ['RESOLVED', 'CLOSED'],
        },
      },
      include: {
        requester: true,
        assignedTo: true,
        category: true,
        subcategory: true,
        _count: {
          select: {
            comments: true,
            attachments: true,
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    });

    return tickets.map(ticket => this.transformTicket(ticket));
  }

  private trackChanges(
    oldTicket: Prisma.TicketGetPayload<Record<string, never>>,
    newTicket: Partial<Prisma.TicketUpdateInput>
  ): Array<{ field: string; oldValue: string; newValue: string }> {
    const changes: Array<{
      field: string;
      oldValue: string;
      newValue: string;
    }> = [];

    const fieldsToTrack = [
      'title',
      'description',
      'priority',
      'status',
      'assignedToId',
      'resolution',
      'impact',
      'categoryId',
      'subcategoryId',
      'slaLevel',
    ];

    for (const field of fieldsToTrack) {
      if (
        newTicket[field] !== undefined &&
        newTicket[field] !== oldTicket[field]
      ) {
        changes.push({
          field,
          oldValue: oldTicket[field]?.toString() || '',
          newValue: newTicket[field]?.toString() || '',
        });
      }
    }

    return changes;
  }

  async findAssignedTickets(userId: string, userRole: string) {
    // Only support staff can see assigned tickets
    if (!['SUPPORT_STAFF', 'SUPPORT_MANAGER', 'ADMIN'].includes(userRole)) {
      throw new BadRequestException(
        'Only support staff, managers, and admins can view assigned tickets'
      );
    }
    return this.getAssignedTickets(userId, {});
  }

  async findOverdueTickets(userId: string, userRole: string) {
    // Only support staff and managers can see overdue tickets
    if (!['SUPPORT_STAFF', 'SUPPORT_MANAGER', 'ADMIN'].includes(userRole)) {
      throw new BadRequestException(
        'Only support staff, managers, and admins can view overdue tickets'
      );
    }
    return this.getOverdueTickets();
  }

  private async autoAssignTicket(
    categoryId: string,
    subcategoryId: string
  ): Promise<string | null> {
    try {
      // Find support staff members who are active and have the least number of open tickets
      // Also consider their expertise in the specific category/subcategory
      const supportStaff = await this.prisma.user.findMany({
        where: {
          roles: {
            hasSome: ['SUPPORT_STAFF', 'SUPPORT_MANAGER'],
          },
          isActive: true,
        },
        include: {
          assignedTickets: {
            where: {
              status: {
                in: [
                  'NEW',
                  'OPEN',
                  'IN_PROGRESS',
                ],
              },
              // Prefer staff who have worked on similar categories and subcategories
              AND: [
                { categoryId: categoryId },
                { subcategoryId: subcategoryId },
              ],
            },
          },
        },
        orderBy: [
          {
            assignedTickets: {
              _count: 'asc',
            },
          },
          // Secondary sort by user creation date for consistency
          {
            createdAt: 'asc',
          },
        ],
      });

      if (supportStaff.length === 0) {
        this.logger.warn('No support staff available for auto-assignment');
        return null;
      }

      // Return the user with the least number of open tickets
      const selectedUser = supportStaff[0];
      this.logger.log(
        `Auto-assigned ticket to user ${selectedUser.id} (${selectedUser.email})`
      );
      return selectedUser.id;
    } catch (error) {
      this.logger.error('Error in auto-assignment:', error);
      return null;
    }
  }

  /**
   * Auto-closes resolved tickets that have been resolved for the configured number of days
   */
  async autoCloseResolvedTickets(): Promise<void> {
    if (!this.systemConfigService.isAutoCloseEnabled()) {
      return;
    }

    try {
      const autoCloseDays = this.systemConfigService.getAutoCloseDays();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - autoCloseDays);

      const ticketsToClose = await this.prisma.ticket.findMany({
        where: {
          status: 'RESOLVED',
          updatedAt: {
            lte: cutoffDate,
          },
        },
        include: {
          requester: true,
          assignedTo: true,
        },
      });

      for (const ticket of ticketsToClose) {
        await this.prisma.ticket.update({
          where: { id: ticket.id },
          data: {
            status: 'CLOSED',
            closedAt: new Date(),
          },
        });

        // Send notification
        await this.notifications.create({
          userId: ticket.requesterId,
          type: 'TICKET_STATUS_CHANGED',
          title: 'Ticket Auto-Closed',
          message: `Your ticket ${ticket.ticketNumber} has been automatically closed after being resolved for ${autoCloseDays} days.`,
          ticketId: ticket.id,
        });

        this.logger.log(`Auto-closed ticket ${ticket.ticketNumber}`);
      }

      if (ticketsToClose.length > 0) {
        this.logger.log(
          `Auto-closed ${ticketsToClose.length} resolved tickets`
        );
      }
    } catch (error) {
      this.logger.error('Error in auto-close process:', error);
    }
  }


  private async resolveDefaultWorkflow(): Promise<{
    defaultWorkflowId: string | null;
    workflowSnapshot: Record<string, unknown> | null;
    workflowVersion: number | null;
    initialStatus: string;
  }> {
    let defaultWorkflowId: string | null = null;
    let workflowSnapshot: Record<string, unknown> | null = null;
    let workflowVersion: number | null = null;
    let initialStatus = 'NEW';

    try {
      const defaultWorkflow = await this.workflowsService.findDefault();
      if (!defaultWorkflow) {
        this.logger.warn(
          'No default workflow found, ticket will be created without workflow',
          'TicketsService'
        );
        return {
          defaultWorkflowId,
          workflowSnapshot,
          workflowVersion,
          initialStatus,
        };
      }

      defaultWorkflowId = defaultWorkflow.id;
      workflowSnapshot = {
        id: defaultWorkflow.id,
        name: defaultWorkflow.name,
        definition: defaultWorkflow.definition,
        transitions: defaultWorkflow.transitions,
        createdAt: defaultWorkflow.createdAt,
      };
      workflowVersion = defaultWorkflow.version || 1;

      if (defaultWorkflow.definition) {
        initialStatus = this.extractInitialStatusFromDefinition(
          defaultWorkflow.definition as WorkflowDefinition
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to resolve default workflow: ${(error as Error).message}`,
        error,
        'TicketsService'
      );
    }

    return {
      defaultWorkflowId,
      workflowSnapshot,
      workflowVersion,
      initialStatus,
    };
  }

  private extractInitialStatusFromDefinition(
    definition: WorkflowDefinition
  ): string {
    const edges = definition.edges ?? [];
    const nodes = definition.nodes ?? [];

    const createEdge = edges.find(
      edge => edge.source === 'create' || edge.data?.isCreateTransition === true
    );

    if (!createEdge || !createEdge.target) {
      return 'NEW';
    }

    const targetNode = nodes.find(node => node.id === createEdge.target);
    if (targetNode?.data?.label) {
      return targetNode.data.label.toUpperCase().replace(/\s+/g, '_');
    }

    return createEdge.target.toUpperCase();
  }

  /**
   * Transform Prisma user to minimal user DTO
   */
  private transformUser(user: any): any {
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles || [],
      activeRole: user.activeRole || undefined, // Optional, may not be in Prisma model
      isActive: user.isActive,
      avatar: user.avatar,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Transform Prisma category to minimal category DTO
   */
  private transformCategory(category: any): any {
    if (!category) return null;
    return {
      id: category.id,
      name: category.name,
      customName: category.customName,
      description: category.description,
    };
  }

  /**
   * Transform Prisma subcategory to minimal subcategory DTO
   */
  private transformSubcategory(subcategory: any): any {
    if (!subcategory) return null;
    return {
      id: subcategory.id,
      name: subcategory.name,
      description: subcategory.description,
    };
  }

  /**
   * Transform Prisma comment to minimal comment DTO
   */
  private transformComment(comment: any): any {
    if (!comment) return null;
    return {
      id: comment.id,
      ticketId: comment.ticketId,
      userId: comment.userId,
      user: this.transformUser(comment.user),
      content: comment.content,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    };
  }

  /**
   * Transform Prisma attachment to minimal attachment DTO
   */
  private transformAttachment(attachment: any): any {
    if (!attachment) return null;
    return {
      id: attachment.id,
      ticketId: attachment.ticketId,
      filename: attachment.filename,
      fileSize: attachment.fileSize,
      fileType: attachment.fileType,
      fileUrl: attachment.fileUrl,
      uploadedBy: this.transformUser(attachment.uploader || attachment.uploadedBy),
      createdAt: attachment.createdAt,
    };
  }

  /**
   * Transform Prisma ticket to response DTO with only necessary fields
   */
  private transformTicket(ticket: any): TicketResponseDto {
    if (!ticket) return null;

    // Transform custom fields if they exist
    let customFields: Record<string, string> | undefined;
    if (ticket.customFields && Array.isArray(ticket.customFields)) {
      customFields = {};
      ticket.customFields.forEach((ticketCustomField: any) => {
        if (ticketCustomField.customField) {
          customFields[ticketCustomField.customField.name] = ticketCustomField.value;
        }
      });
    } else if (ticket.customFields && typeof ticket.customFields === 'object' && !Array.isArray(ticket.customFields)) {
      customFields = ticket.customFields;
    }

    // Get related ticket IDs if they exist
    let relatedTickets: string[] | undefined;
    if (ticket.relatedTickets && Array.isArray(ticket.relatedTickets)) {
      relatedTickets = ticket.relatedTickets.map((rel: any) => 
        rel.relatedTicketId || rel.id
      );
    }

    // Only include comments and attachments if they were included in the query
    // This prevents unnecessary data in list endpoints
    const comments = ticket.comments && Array.isArray(ticket.comments) && ticket.comments.length > 0
      ? ticket.comments.map((c: any) => this.transformComment(c))
      : undefined;
    
    const attachments = ticket.attachments && Array.isArray(ticket.attachments) && ticket.attachments.length > 0
      ? ticket.attachments.map((a: any) => this.transformAttachment(a))
      : undefined;

    return {
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      title: ticket.title,
      description: ticket.description,
      categoryId: ticket.categoryId,
      subcategoryId: ticket.subcategoryId,
      category: this.transformCategory(ticket.category),
      subcategory: ticket.subcategory ? this.transformSubcategory(ticket.subcategory) : null,
      priority: ticket.priority,
      status: ticket.status,
      impact: ticket.impact,
      requester: this.transformUser(ticket.requester),
      assignedTo: ticket.assignedTo ? this.transformUser(ticket.assignedTo) : null,
      dueDate: ticket.dueDate,
      resolution: ticket.resolution,
      comments,
      attachments,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      closedAt: ticket.closedAt,
      responseTime: ticket.responseTime,
      resolutionTime: ticket.resolutionTime,
      customFields,
      relatedTickets,
      workflowSnapshot: ticket.workflowSnapshot,
      workflowVersion: ticket.workflowVersion,
    };
  }

}
