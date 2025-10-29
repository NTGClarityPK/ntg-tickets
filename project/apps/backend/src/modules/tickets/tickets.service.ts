import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import {
  TicketPriority,
  TicketImpact,
  TicketUrgency,
  SLALevel,
  Prisma,
} from '@prisma/client';
import { LoggerService } from '../../common/logger/logger.service';
import { RedisService } from '../../common/redis/redis.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ElasticsearchService } from '../elasticsearch/elasticsearch.service';
import { SLAService } from '../../common/sla/sla.service';
import { WebSocketGateway } from '../websocket/websocket.gateway';
import { SystemConfigService } from '../../common/config/system-config.service';
import { WorkflowExecutionService } from '../workflows/workflow-execution.service';

// Define proper types for ticket filters
interface TicketFilters {
  page?: number;
  limit?: number;
  cursor?: string;
  status?: string[];
  priority?: string[];
  category?: string[];
  assignedTo?: string[];
  assignedToId?: string[];
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
  urgency?: TicketUrgency;
  slaLevel?: SLALevel;
  categoryId?: string;
  subcategoryId?: string;
  assignedToId?: string;
  customFields?: Record<string, unknown>;
}

/**
 * Service for managing tickets in the NTG Ticket.
 *
 * This service provides comprehensive ticket management functionality including:
 * - Creating, reading, updating, and deleting tickets
 * - Status management and workflow enforcement
 * - Assignment and reassignment of tickets
 * - SLA monitoring and escalation
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
    private readonly slaService: SLAService,
    private readonly websocketGateway: WebSocketGateway,
    private readonly systemConfigService: SystemConfigService,
    private readonly workflowExecutionService: WorkflowExecutionService
  ) {}

  /**
   * Creates a new ticket in the system.
   *
   * This method creates a new ticket with the provided data, validates the requester,
   * calculates priority and SLA information, and sends appropriate notifications.
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

    // Validate category exists
    this.logger.log(
      `Looking up category with ID: ${createTicketDto.category}`,
      'TicketsService'
    );
    const category = await this.prisma.category.findUnique({
      where: { id: createTicketDto.category },
    });

    if (!category) {
      this.logger.error(
        `Category not found with ID: ${createTicketDto.category}`,
        'TicketsService'
      );
      throw new NotFoundException('Category not found');
    }
    this.logger.log(`Found category: ${category.name}`, 'TicketsService');

    // Validate subcategory exists and belongs to category (if provided)
    let subcategory = null;
    if (createTicketDto.subcategory) {
      this.logger.log(
        `Looking up subcategory with ID: ${createTicketDto.subcategory} for category: ${createTicketDto.category}`,
        'TicketsService'
      );
      subcategory = await this.prisma.subcategory.findUnique({
        where: {
          id: createTicketDto.subcategory,
          categoryId: createTicketDto.category,
        },
      });

      if (!subcategory) {
        this.logger.error(
          `Subcategory not found with ID: ${createTicketDto.subcategory} for category: ${createTicketDto.category}`,
          'TicketsService'
        );
        throw new NotFoundException(
          'Subcategory not found or does not belong to category'
        );
      }
      this.logger.log(`Found subcategory: ${subcategory.name}`, 'TicketsService');
    } else {
      this.logger.log('No subcategory provided, creating ticket without subcategory', 'TicketsService');
    }

    // Generate ticket number
    const ticketNumber = await this.generateTicketNumber();

    // Calculate due date based on SLA level using SLA service
    const dueDate = this.slaService.calculateDueDate(
      createTicketDto.slaLevel,
      createTicketDto.priority
    );

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
    let defaultWorkflowId = null;
    let workflowSnapshot = null;
    let workflowVersion = null;
    try {
      const defaultWorkflow = await this.workflowExecutionService['workflowsService'].findDefault();
      if (defaultWorkflow) {
        defaultWorkflowId = defaultWorkflow.id;
        // Capture the complete workflow definition at ticket creation time
        workflowSnapshot = {
          id: defaultWorkflow.id,
          name: defaultWorkflow.name,
          definition: defaultWorkflow.definition,
          transitions: defaultWorkflow.transitions,
          createdAt: defaultWorkflow.createdAt,
        };
        workflowVersion = defaultWorkflow.version || 1;
        this.logger.log(`Captured workflow snapshot (v${workflowVersion}) for new ticket`, 'TicketsService');
      }
    } catch (error) {
      this.logger.warn('No default workflow found, ticket will be created without workflow', 'TicketsService');
    }

    // Create ticket
    const ticket = await this.prisma.ticket.create({
      data: {
        ticketNumber,
        title: createTicketDto.title,
        description: createTicketDto.description,
        categoryId: ticketCategory.id,
        subcategoryId: subcategory?.id || null,
        priority: createTicketDto.priority,
        impact: createTicketDto.impact,
        urgency: createTicketDto.urgency,
        slaLevel: createTicketDto.slaLevel,
        requesterId: userId,
        assignedToId: assignedToId,
        dueDate,
        status: 'NEW',
        workflowId: defaultWorkflowId,
        workflowSnapshot: workflowSnapshot as any, // Store snapshot for future use
        workflowVersion: workflowVersion,
      },
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

    // Index in Elasticsearch
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

    // Emit WebSocket event
    this.websocketGateway.emitTicketCreated(ticket);

    this.logger.log(`Ticket created: ${ticket.ticketNumber}`, 'TicketsService');
    return ticket;
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
      `Finding tickets for user ${userId} with role ${userRole}`,
      'TicketsService'
    );

    const where: Prisma.TicketWhereInput = {};

    // NOTE: All roles can see all tickets on the "All Tickets" page
    // Role-based filtering is only applied on the "My Tickets" page (findMyTickets method)
    // This follows the requirement that:
    // - "All Tickets" shows all tickets for everyone
    // - "My Tickets" shows tickets created by or assigned to the user

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

    if (filters.assignedTo && filters.assignedTo.length > 0) {
      where.assignedToId = { in: filters.assignedTo };
    }

    if (filters.assignedToId && filters.assignedToId.length > 0) {
      where.assignedToId = { in: filters.assignedToId };
    }

    if (filters.requesterId && filters.requesterId.length > 0) {
      where.requesterId = { in: filters.requesterId };
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
      data: tickets,
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

    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
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

    // Return ticket with transformed custom fields
    return {
      ...ticket,
      customFields: customFieldsObject,
    };
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

    const existingTicket = await this.prisma.ticket.findUnique({
      where: { id },
    });

    if (!existingTicket) {
      throw new NotFoundException('Ticket not found');
    }

    // Check permissions
    if (userRole === 'END_USER' && existingTicket.requesterId !== userId) {
      throw new ForbiddenException(
        'Access denied: You can only update your own tickets'
      );
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
    return ticket;
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

    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
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

    // Get the current ticket to check permissions
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // Validate user role can update ticket status
    // END_USER can only reopen closed tickets (CLOSED → REOPENED)
    if (userRole === 'END_USER') {
      if (
        ticket.status !== 'CLOSED' ||
        status !== 'REOPENED'
      ) {
        throw new BadRequestException(
          'End users can only reopen closed tickets'
        );
      }
      // Check if the end user is the ticket requester
      if (ticket.requesterId !== userId) {
        throw new ForbiddenException(
          'Access denied: You can only reopen your own tickets'
        );
      }
    } else if (
      !['SUPPORT_STAFF', 'SUPPORT_MANAGER', 'ADMIN'].includes(userRole)
    ) {
      this.logger.error(
        `Permission denied for user role: ${userRole}, expected: SUPPORT_STAFF, SUPPORT_MANAGER, or ADMIN`
      );
      throw new BadRequestException(
        'Only support staff, managers, and admins can update ticket status'
      );
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
        
        return result.ticket;
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
    return updatedTicket;
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
    if (!['SUPPORT_STAFF', 'SUPPORT_MANAGER', 'ADMIN'].includes(userRole)) {
      this.logger.error(
        `User ${userId} with role ${userRole} cannot assign tickets`,
        'TicketsService'
      );
      throw new BadRequestException(
        'Only support staff, managers and admins can assign tickets'
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

    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
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
    return updatedTicket;
  }

  private async generateTicketNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `TKT-${year}-`;

    // Get the last ticket number for this year
    const lastTicket = await this.prisma.ticket.findFirst({
      where: {
        ticketNumber: {
          startsWith: prefix,
        },
      },
      orderBy: {
        ticketNumber: 'desc',
      },
    });

    let nextNumber = 1;
    if (lastTicket) {
      const lastNumber = parseInt(lastTicket.ticketNumber.replace(prefix, ''));
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${nextNumber.toString().padStart(6, '0')}`;
  }

  async getTicketsApproachingSLA() {
    return this.slaService.getTicketsApproachingSLA();
  }

  async getBreachedSLATickets() {
    return this.slaService.getBreachedSLATickets();
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

    // Show tickets created by OR assigned to the user
    const tickets = await this.prisma.ticket.findMany({
      where: {
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

    return tickets;
  }

  async getMyTickets(userId: string, filters: TicketFilters) {
    this.logger.log(`Getting tickets for user ${userId}`, 'TicketsService');

    const where: Prisma.TicketWhereInput = {
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
      data: tickets,
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

    // Debug logging removed for production

    const where: Prisma.TicketWhereInput = {
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
      data: tickets,
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

    const now = new Date();
    const tickets = await this.prisma.ticket.findMany({
      where: {
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

    return tickets;
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
      'urgency',
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
}
