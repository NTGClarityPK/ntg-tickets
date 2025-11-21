import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { CreateWorkflowTransitionDto } from './dto/create-workflow-transition.dto';
import { WorkflowStatus, UserRole } from '@prisma/client';

@Injectable()
export class WorkflowsService {
  constructor(private prisma: PrismaService) {}

  async create(createWorkflowDto: CreateWorkflowDto, userId: string) {
    try {
      console.log('🔧 WorkflowService.create called with:', { createWorkflowDto, userId });
      
      const { definition, workingStatuses, doneStatuses, ...workflowData } = createWorkflowDto;

      // If this is set as default, unset other default workflows
      if (workflowData.isDefault) {
        console.log('🔄 Unsetting other default workflows...');
        await this.prisma.workflow.updateMany({
          where: { isDefault: true },
          data: { isDefault: false },
        });
      }

      // If this workflow is being created as ACTIVE, deactivate all other workflows
      if (workflowData.status === WorkflowStatus.ACTIVE) {
        console.log('🔄 Deactivating all other workflows since new workflow is ACTIVE...');
        await this.prisma.workflow.updateMany({
          where: { status: WorkflowStatus.ACTIVE },
          data: { status: WorkflowStatus.INACTIVE },
        });
      }

      // Set default status categorization for default workflow
      const statusCategorization: any = {};
      if (workflowData.isDefault) {
        // Default workflow: working = new, open, in-progress, reopened; done = closed, resolved
        statusCategorization.workingStatuses = ['NEW', 'OPEN', 'IN_PROGRESS', 'REOPENED'];
        statusCategorization.doneStatuses = ['CLOSED', 'RESOLVED'];
      } else {
        // Use provided values or empty arrays
        statusCategorization.workingStatuses = workingStatuses || [];
        statusCategorization.doneStatuses = doneStatuses || [];
      }

      console.log('💾 Creating workflow in database...');
      const workflow = await this.prisma.workflow.create({
        data: {
          ...workflowData,
          ...statusCategorization,
          definition: definition || {},
          createdBy: userId,
        },
        include: {
          createdByUser: {
            select: { id: true, name: true, email: true },
          },
          transitions: {
            include: {
              conditions: true,
              actions: true,
              permissions: true,
            },
          },
        },
      });

      console.log('✅ Workflow created successfully:', workflow.id);
      return workflow;
    } catch (error) {
      console.error('❌ Error in WorkflowService.create:', error);
      throw error;
    }
  }

  async findAll() {
    // Only return workflows that haven't been soft-deleted
    return this.prisma.workflow.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        createdByUser: {
          select: { id: true, name: true, email: true },
        },
        transitions: {
          include: {
            conditions: true,
            actions: true,
            permissions: true,
          },
        },
        _count: {
          select: {
            tickets: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const workflow = await this.prisma.workflow.findUnique({
      where: { id },
      include: {
        createdByUser: {
          select: { id: true, name: true, email: true },
        },
        transitions: {
          include: {
            conditions: true,
            actions: true,
            permissions: true,
          },
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            tickets: true,
          },
        },
      },
    });

    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }

    return workflow;
  }

  async findDefault() {
    // Return the currently ACTIVE workflow (there should only be one)
    // This is what the frontend uses to check permissions
    return this.prisma.workflow.findFirst({
      where: { 
        status: WorkflowStatus.ACTIVE,
        deletedAt: null, // Only return non-deleted workflows
      },
      include: {
        createdByUser: {
          select: { id: true, name: true, email: true },
        },
        transitions: {
          include: {
            conditions: true,
            actions: true,
            permissions: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  async update(id: string, updateWorkflowDto: UpdateWorkflowDto, userId: string) {
    const existingWorkflow = await this.findOne(id);

    // Prevent editing system default workflow
    if (existingWorkflow.isSystemDefault) {
      throw new BadRequestException(
        'Cannot edit system default workflow. Create a new workflow instead.'
      );
    }

    // If this is set as default, unset other default workflows
    if (updateWorkflowDto.isDefault) {
      await this.prisma.workflow.updateMany({
        where: { 
          isDefault: true,
          id: { not: id },
        },
        data: { isDefault: false },
      });
    }

    // If status is being changed to ACTIVE, deactivate all other workflows
    if (updateWorkflowDto.status === WorkflowStatus.ACTIVE && existingWorkflow.status !== WorkflowStatus.ACTIVE) {
      console.log('🔄 Status changing to ACTIVE, deactivating all other workflows...');
      await this.prisma.workflow.updateMany({
        where: { 
          id: { not: id },
          status: WorkflowStatus.ACTIVE,
        },
        data: { status: WorkflowStatus.INACTIVE },
      });
    }

    const { definition, ...workflowData } = updateWorkflowDto;

    const workflow = await this.prisma.workflow.update({
      where: { id },
      data: {
        ...workflowData,
        ...(definition && { definition }),
      },
      include: {
        createdByUser: {
          select: { id: true, name: true, email: true },
        },
        transitions: {
          include: {
            conditions: true,
            actions: true,
            permissions: true,
          },
        },
      },
    });

    return workflow;
  }

  async remove(id: string) {
    const workflow = await this.findOne(id);

    // Prevent deleting system default workflow
    if (workflow.isSystemDefault) {
      throw new BadRequestException(
        'Cannot delete system default workflow. It is required for the system to function.'
      );
    }

    // If the workflow being deleted is active, we need to activate the system default
    const wasActive = workflow.status === WorkflowStatus.ACTIVE;
    if (wasActive) {
      console.log('⚠️  Deleting active workflow. Activating system default workflow...');
    }

    // Check if workflow is being used by any tickets
    const ticketCount = await this.prisma.ticket.count({
      where: { workflowId: id },
    });

    let deletedWorkflow;
    if (ticketCount > 0) {
      // Soft delete: Hide from UI but keep in database for existing tickets
      console.log(`⚠️  Workflow ${id} is used by ${ticketCount} tickets. Performing soft delete.`);
      deletedWorkflow = await this.prisma.workflow.update({
        where: { id },
        data: { 
          deletedAt: new Date(),
          isDefault: false, // Can't be default if deleted
          status: WorkflowStatus.INACTIVE, // Deactivate deleted workflows
        },
      });
    } else {
      // Hard delete if no tickets are using it
      deletedWorkflow = await this.prisma.workflow.delete({
        where: { id },
      });
    }

    // If the deleted workflow was active, activate the system default
    if (wasActive) {
      const systemDefault = await this.prisma.workflow.findFirst({
        where: { isSystemDefault: true },
      });

      if (systemDefault) {
        console.log(`✅ Activating system default workflow: ${systemDefault.id}`);
        await this.prisma.workflow.update({
          where: { id: systemDefault.id },
          data: { status: WorkflowStatus.ACTIVE },
        });
      }
    }

    return deletedWorkflow;
  }

  async activate(
    id: string,
    workingStatuses?: string[],
    doneStatuses?: string[],
  ) {
    const workflow = await this.findOne(id);
    
    // Deactivate all other workflows (including system default) to ensure only one is active
    console.log('🔄 Deactivating all other workflows before activating new one...');
    await this.prisma.workflow.updateMany({
      where: { 
        id: { not: id },
        status: WorkflowStatus.ACTIVE,
      },
      data: { status: WorkflowStatus.INACTIVE },
    });
    
    // Prepare update data
    const updateData: any = { status: WorkflowStatus.ACTIVE };
    
    // If status categorization is provided, save it
    if (workingStatuses !== undefined) {
      updateData.workingStatuses = workingStatuses;
    }
    if (doneStatuses !== undefined) {
      updateData.doneStatuses = doneStatuses;
    }
    
    console.log(`✅ Activating workflow: ${id}`, { workingStatuses, doneStatuses });
    return this.prisma.workflow.update({
      where: { id },
      data: updateData,
    });
  }

  async deactivate(id: string) {
    const workflow = await this.findOne(id);
    
    // Prevent deactivating system default workflow
    if (workflow.isSystemDefault) {
      throw new BadRequestException(
        'Cannot deactivate system default workflow. It is required for the system to function.'
      );
    }
    
    // If the workflow being deactivated is currently active, we need to activate the system default
    const wasActive = workflow.status === WorkflowStatus.ACTIVE;
    
    // Deactivate the workflow
    const deactivatedWorkflow = await this.prisma.workflow.update({
      where: { id },
      data: { status: WorkflowStatus.INACTIVE },
    });
    
    // If the deactivated workflow was active, activate the system default
    if (wasActive) {
      console.log('⚠️  Deactivating active workflow. Activating system default workflow...');
      const systemDefault = await this.prisma.workflow.findFirst({
        where: { isSystemDefault: true },
      });

      if (systemDefault) {
        console.log(`✅ Activating system default workflow: ${systemDefault.id}`);
        await this.prisma.workflow.update({
          where: { id: systemDefault.id },
          data: { status: WorkflowStatus.ACTIVE },
        });
      }
    }
    
    return deactivatedWorkflow;
  }

  async setAsDefault(id: string) {
    const workflow = await this.findOne(id);

    // Unset other default workflows (but not system default)
    await this.prisma.workflow.updateMany({
      where: { 
        isDefault: true,
        isSystemDefault: false, // Don't unset system default
      },
      data: { isDefault: false },
    });

    return this.prisma.workflow.update({
      where: { id },
      data: { isDefault: true },
    });
  }

  // Transition management methods
  async addTransition(workflowId: string, createTransitionDto: CreateWorkflowTransitionDto) {
    const workflow = await this.findOne(workflowId);

    const { conditions, actions, permissions, ...transitionData } = createTransitionDto;

    const transition = await this.prisma.workflowTransition.create({
      data: {
        ...transitionData,
        workflowId,
        conditions: {
          create: conditions || [],
        },
        actions: {
          create: actions || [],
        },
        permissions: {
          create: permissions || [],
        },
      },
      include: {
        conditions: true,
        actions: true,
        permissions: true,
      },
    });

    return transition;
  }

  async updateTransition(transitionId: string, updateData: Partial<CreateWorkflowTransitionDto>) {
    const { conditions, actions, permissions, ...transitionData } = updateData;

    // Update transition
    const transition = await this.prisma.workflowTransition.update({
      where: { id: transitionId },
      data: transitionData,
    });

    // Update conditions if provided
    if (conditions) {
      await this.prisma.workflowCondition.deleteMany({
        where: { transitionId },
      });
      
      await this.prisma.workflowCondition.createMany({
        data: conditions.map(condition => ({
          ...condition,
          transitionId,
        })),
      });
    }

    // Update actions if provided
    if (actions) {
      await this.prisma.workflowAction.deleteMany({
        where: { transitionId },
      });
      
      await this.prisma.workflowAction.createMany({
        data: actions.map(action => ({
          ...action,
          transitionId,
        })),
      });
    }

    // Update permissions if provided
    if (permissions) {
      await this.prisma.workflowPermission.deleteMany({
        where: { transitionId },
      });
      
      await this.prisma.workflowPermission.createMany({
        data: permissions.map(permission => ({
          ...permission,
          transitionId,
        })),
      });
    }

    return this.prisma.workflowTransition.findUnique({
      where: { id: transitionId },
      include: {
        conditions: true,
        actions: true,
        permissions: true,
      },
    });
  }

  async removeTransition(transitionId: string) {
    return this.prisma.workflowTransition.delete({
      where: { id: transitionId },
    });
  }

  // Workflow execution methods
  async canExecuteTransition(
    workflowId: string,
    fromState: string,
    toState: string,
    userRole: UserRole
  ) {
    const transition = await this.prisma.workflowTransition.findFirst({
      where: {
        workflowId,
        fromState,
        toState,
        isActive: true,
        permissions: {
          some: {
            role: userRole,
            canExecute: true,
          },
        },
      },
      include: {
        conditions: true,
        permissions: true,
      },
    });

    return !!transition;
  }

  async executeTransition(
    ticketId: string,
    workflowId: string,
    fromState: string,
    toState: string,
    userId: string,
    comment?: string
  ) {
    const transition = await this.prisma.workflowTransition.findFirst({
      where: {
        workflowId,
        fromState,
        toState,
        isActive: true,
      },
      include: {
        conditions: true,
        actions: true,
        permissions: true,
      },
    });

    if (!transition) {
      throw new BadRequestException('Invalid transition');
    }

    // Execute the transition
    const execution = await this.prisma.workflowExecution.create({
      data: {
        ticketId,
        workflowId,
        fromState,
        toState,
        transitionId: transition.id,
        executedBy: userId,
        comment,
      },
    });

    // Update ticket status
    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: { 
        status: toState as any, // Cast to TicketStatus enum
        updatedAt: new Date(),
      },
    });

    // TODO: Execute actions (send notifications, etc.)
    // This would be implemented based on the action types

    return execution;
  }

  /**
   * Get all unique statuses from a workflow's transitions
   */
  async getWorkflowStatuses(workflowId: string): Promise<string[]> {
    const workflow = await this.findOne(workflowId);
    const statuses = new Set<string>();
    
    if (workflow.transitions) {
      workflow.transitions.forEach(transition => {
        if (transition.fromState) statuses.add(transition.fromState);
        if (transition.toState) statuses.add(transition.toState);
      });
    }
    
    return Array.from(statuses);
  }

  /**
   * Get status categorization for a workflow
   */
  async getStatusCategorization(workflowId: string) {
    const workflow = await this.prisma.workflow.findUnique({
      where: { id: workflowId },
    });

    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }

    // Type assertion needed until Prisma client types are fully updated
    const workflowWithStatuses = workflow as any;

    return {
      workingStatuses: (workflowWithStatuses.workingStatuses as string[]) || [],
      doneStatuses: (workflowWithStatuses.doneStatuses as string[]) || [],
    };
  }

  /**
   * Get all unique statuses from all workflows (including deleted ones for historical reference)
   * Returns statuses with workflow identifier in format: workflow-{workflowId}-{statusName}
   * Also includes default system statuses for workflows that don't have transitions yet
   */
  async getAllWorkflowStatuses() {
    try {
      // Default system statuses that should always be available
      const defaultSystemStatuses = [
        'NEW',
        'OPEN',
        'IN_PROGRESS',
        'ON_HOLD',
        'RESOLVED',
        'CLOSED',
        'REOPENED',
      ];

      // Get all workflows including soft-deleted ones to capture all historical statuses
      const allWorkflows = await this.prisma.workflow.findMany({
        where: {},
        select: {
          id: true,
          name: true,
          definition: true,
          transitions: {
            select: {
              fromState: true,
              toState: true,
            },
          },
        },
      });

      const statusMap = new Map<string, Array<{ workflowId: string; workflowName: string; status: string }>>();

      allWorkflows.forEach(workflow => {
        const statuses = new Set<string>();
        
        // Common action names/patterns that should not be treated as states
        const actionPatterns = [
          'CREATE_TICKET',
          'Create Ticket',
          'create ticket',
          'CREATE',
          'Create',
          'START',
          'END',
        ];
        
        // Helper function to check if a string is an action (case-insensitive)
        const isAction = (state: string): boolean => {
          if (!state) return false;
          const upperState = state.toUpperCase().trim();
          return actionPatterns.some(pattern => 
            upperState === pattern.toUpperCase() || 
            (upperState.includes('CREATE') && upperState.includes('TICKET'))
          );
        };
        
        // First, try to extract states from workflow definition (diagram nodes)
        if (workflow.definition && typeof workflow.definition === 'object') {
          const definition = workflow.definition as any;
          // Extract states from nodes if they exist in the definition
          if (definition.nodes && Array.isArray(definition.nodes)) {
            definition.nodes.forEach((node: any) => {
              let stateLabel = null;
              if (node.data?.label) {
                stateLabel = node.data.label;
              } else if (node.id) {
                stateLabel = node.id;
              }
              // Only add if it's not an action
              if (stateLabel && !isAction(stateLabel)) {
                statuses.add(stateLabel);
              }
            });
          }
        }
        
        // Collect all unique statuses from transitions (this takes precedence)
        // Filter out action names like "Create Ticket"
        if (workflow.transitions && workflow.transitions.length > 0) {
          workflow.transitions.forEach(transition => {
            // Add toState (destination) - these are actual ticket statuses
            if (transition.toState && !isAction(transition.toState)) {
              statuses.add(transition.toState);
            }
            // Add fromState, but exclude if it's an action
            if (transition.fromState && !isAction(transition.fromState)) {
              statuses.add(transition.fromState);
            }
          });
        }

        // Only if workflow has NO states at all (no definition nodes and no transitions), 
        // include default system statuses for that workflow
        if (statuses.size === 0) {
          defaultSystemStatuses.forEach(status => {
            statuses.add(status);
          });
        }

        // Store each status with workflow info (even if same status name, different workflow = different entry)
        statuses.forEach(status => {
          const key = `${workflow.id}-${status}`;
          if (!statusMap.has(key)) {
            statusMap.set(key, []);
          }
          statusMap.get(key)!.push({
            workflowId: workflow.id,
            workflowName: workflow.name,
            status: status,
          });
        });
      });

      // Convert to array format: workflow-{workflowId}-{statusName}
      const result = Array.from(statusMap.entries()).map(([key, infos]) => {
        const info = infos[0]; // All entries for same key have same workflow info
        return {
          id: `workflow-${info.workflowId}-${info.status}`,
          workflowId: info.workflowId,
          workflowName: info.workflowName,
          status: info.status,
          displayName: `${info.workflowName} - ${info.status}`,
        };
      });

      return result;
    } catch (error) {
      console.error('Error in getAllWorkflowStatuses:', error);
      throw error;
    }
  }

  /**
   * Get dashboard stats based on active workflow's status categorization
   * Returns counts for all, working, done, and hold tickets
   */
  async getDashboardStats(userId?: string, userRole?: UserRole) {
    try {
      console.log('🔍 getDashboardStats called with:', { userId, userRole, userRoleType: typeof userRole });
      // Get active workflow
      const activeWorkflow = await this.prisma.workflow.findFirst({
        where: { status: WorkflowStatus.ACTIVE },
        select: {
          id: true,
          workingStatuses: true,
          doneStatuses: true,
        },
      });

      if (!activeWorkflow) {
        // No active workflow, return zeros
        return {
          all: 0,
          working: 0,
          done: 0,
          hold: 0,
        };
      }

      // Get status categorization or use defaults
      const workingStatusIds = (activeWorkflow.workingStatuses && activeWorkflow.workingStatuses.length > 0)
        ? activeWorkflow.workingStatuses
        : ['NEW', 'OPEN', 'IN_PROGRESS', 'REOPENED'];
      const doneStatusIds = (activeWorkflow.doneStatuses && activeWorkflow.doneStatuses.length > 0)
        ? activeWorkflow.doneStatuses
        : ['CLOSED', 'RESOLVED'];

      // Extract workflowId and statusName from workflow-specific format
      const extractWorkflowAndStatus = (statusId: string): { workflowId: string | null; statusName: string } => {
        if (statusId.startsWith('workflow-')) {
          const match = statusId.match(/^workflow-([a-f0-9-]+)-(.+)$/i);
          if (match && match[1] && match[2]) {
            return { workflowId: match[1], statusName: match[2] };
          }
          const lastHyphenIndex = statusId.lastIndexOf('-');
          if (lastHyphenIndex > 0 && lastHyphenIndex < statusId.length - 1) {
            const workflowIdPart = statusId.substring(8, lastHyphenIndex);
            return { workflowId: workflowIdPart, statusName: statusId.substring(lastHyphenIndex + 1) };
          }
        }
        return { workflowId: null, statusName: statusId };
      };

      // Normalize status name (uppercase, replace spaces with underscores)
      const normalizeStatus = (status: string): string => {
        return status.toUpperCase().replace(/\s+/g, '_').trim();
      };

      // Build maps: workflowId -> Set of normalized status names
      const workingStatusesByWorkflow = new Map<string, Set<string>>();
      const doneStatusesByWorkflow = new Map<string, Set<string>>();

      workingStatusIds.forEach(statusId => {
        const { workflowId, statusName } = extractWorkflowAndStatus(statusId);
        const normalized = normalizeStatus(statusName);
        const mappedWorkflowId = workflowId === null ? activeWorkflow.id : workflowId;
        
        if (!workingStatusesByWorkflow.has(mappedWorkflowId)) {
          workingStatusesByWorkflow.set(mappedWorkflowId, new Set());
        }
        workingStatusesByWorkflow.get(mappedWorkflowId)!.add(normalized);
      });

      doneStatusIds.forEach(statusId => {
        const { workflowId, statusName } = extractWorkflowAndStatus(statusId);
        const normalized = normalizeStatus(statusName);
        const mappedWorkflowId = workflowId === null ? activeWorkflow.id : workflowId;
        
        if (!doneStatusesByWorkflow.has(mappedWorkflowId)) {
          doneStatusesByWorkflow.set(mappedWorkflowId, new Set());
        }
        doneStatusesByWorkflow.get(mappedWorkflowId)!.add(normalized);
      });

      // Build base WHERE conditions for user role (for raw SQL)
      const baseConditions: string[] = [];
      console.log('🔍 Checking user role:', { userRole, SUPPORT_STAFF: UserRole.SUPPORT_STAFF, END_USER: UserRole.END_USER, userId });
      if (userRole === UserRole.SUPPORT_STAFF && userId) {
        baseConditions.push(`"assignedToId" = '${userId.replace(/'/g, "''")}'`);
        console.log('🔍 Added SUPPORT_STAFF filter');
      } else if (userRole === UserRole.END_USER && userId) {
        baseConditions.push(`"requesterId" = '${userId.replace(/'/g, "''")}'`);
        console.log('🔍 Added END_USER filter');
      } else {
        console.log('🔍 No role filter (Manager/Admin - see all tickets)');
      }
      // Support Manager and Admin see all tickets (no additional filter)

      // Get all tickets count using raw SQL for consistency
      const allWhereClause = baseConditions.length > 0
        ? `WHERE ${baseConditions.join(' AND ')}`
        : '';
      const allCountResult = await this.prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
        `SELECT COUNT(*)::int as count FROM tickets ${allWhereClause}`
      );
      const allCount = Number(allCountResult[0]?.count || 0);

      // Use raw SQL with case-insensitive matching for better reliability
      // Build OR conditions for workflow-status combinations
      const buildRawQueryConditions = (statusesByWorkflow: Map<string, Set<string>>): string => {
        const conditions: string[] = [];
        const statusSet = new Set<string>(); // Collect all unique statuses across all workflows
        
        statusesByWorkflow.forEach((statusSetForWorkflow, workflowId) => {
          statusSetForWorkflow.forEach(normalizedStatus => {
            statusSet.add(normalizedStatus); // Collect status for null workflowId matching
            
            // Normalize ticket status in database (uppercase, spaces to underscores) and compare
            // Match both exact workflow and active workflow if different
            const workflowIdParam = workflowId.replace(/'/g, "''"); // Escape single quotes
            const statusParam = normalizedStatus.replace(/'/g, "''"); // Escape single quotes
            // Column names need quotes for camelCase: "workflowId" and "status"
            conditions.push(
              `("workflowId" = '${workflowIdParam}' AND UPPER(REPLACE("status", ' ', '_')) = '${statusParam}')`
            );
            if (workflowId !== activeWorkflow.id) {
              const activeWorkflowIdParam = activeWorkflow.id.replace(/'/g, "''");
              conditions.push(
                `("workflowId" = '${activeWorkflowIdParam}' AND UPPER(REPLACE("status", ' ', '_')) = '${statusParam}')`
              );
            }
          });
        });
        
        return conditions.length > 0 ? conditions.join(' OR ') : 'FALSE';
      };

      // Get working tickets count using raw SQL
      const workingStatusConditions = buildRawQueryConditions(workingStatusesByWorkflow);
      let workingCount = 0;
      if (workingStatusConditions !== 'FALSE') {
        const whereClause = baseConditions.length > 0
          ? `WHERE ${baseConditions.join(' AND ')} AND (${workingStatusConditions})`
          : `WHERE (${workingStatusConditions})`;
        
        const result = await this.prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
          `SELECT COUNT(*)::int as count FROM tickets ${whereClause}`
        );
        workingCount = Number(result[0]?.count || 0);
      }

      // Get done tickets count using raw SQL
      const doneStatusConditions = buildRawQueryConditions(doneStatusesByWorkflow);
      let doneCount = 0;
      if (doneStatusConditions !== 'FALSE') {
        const whereClause = baseConditions.length > 0
          ? `WHERE ${baseConditions.join(' AND ')} AND (${doneStatusConditions})`
          : `WHERE (${doneStatusConditions})`;
        
        const result = await this.prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
          `SELECT COUNT(*)::int as count FROM tickets ${whereClause}`
        );
        doneCount = Number(result[0]?.count || 0);
      }

      // Hold tickets are everything else
      const holdCount = allCount - workingCount - doneCount;

      return {
        all: allCount,
        working: workingCount,
        done: doneCount,
        hold: holdCount,
      };
    } catch (error) {
      console.error('Error in getDashboardStats:', error);
      throw error;
    }
  }

  async getStaffPerformance() {
    try {
      // Get active workflow
      const activeWorkflow = await this.prisma.workflow.findFirst({
        where: { status: WorkflowStatus.ACTIVE },
        select: {
          id: true,
          workingStatuses: true,
          doneStatuses: true,
        },
      });

      if (!activeWorkflow) {
        return [];
      }

      // Get status categorization or use defaults
      const workingStatusIds = (activeWorkflow.workingStatuses && activeWorkflow.workingStatuses.length > 0)
        ? activeWorkflow.workingStatuses
        : ['NEW', 'OPEN', 'IN_PROGRESS', 'REOPENED'];
      const doneStatusIds = (activeWorkflow.doneStatuses && activeWorkflow.doneStatuses.length > 0)
        ? activeWorkflow.doneStatuses
        : ['CLOSED', 'RESOLVED'];

      // Extract workflowId and statusName from workflow-specific format
      const extractWorkflowAndStatus = (statusId: string): { workflowId: string | null; statusName: string } => {
        if (statusId.startsWith('workflow-')) {
          const match = statusId.match(/^workflow-([a-f0-9-]+)-(.+)$/i);
          if (match && match[1] && match[2]) {
            return { workflowId: match[1], statusName: match[2] };
          }
          const lastHyphenIndex = statusId.lastIndexOf('-');
          if (lastHyphenIndex > 0 && lastHyphenIndex < statusId.length - 1) {
            const workflowIdPart = statusId.substring(8, lastHyphenIndex);
            return { workflowId: workflowIdPart, statusName: statusId.substring(lastHyphenIndex + 1) };
          }
        }
        return { workflowId: null, statusName: statusId };
      };

      // Normalize status name (uppercase, replace spaces with underscores)
      const normalizeStatus = (status: string): string => {
        return status.toUpperCase().replace(/\s+/g, '_').trim();
      };

      // Build maps: workflowId -> Set of normalized status names
      const workingStatusesByWorkflow = new Map<string, Set<string>>();
      const doneStatusesByWorkflow = new Map<string, Set<string>>();

      workingStatusIds.forEach(statusId => {
        const { workflowId, statusName } = extractWorkflowAndStatus(statusId);
        const normalized = normalizeStatus(statusName);
        const mappedWorkflowId = workflowId === null ? activeWorkflow.id : workflowId;
        
        if (!workingStatusesByWorkflow.has(mappedWorkflowId)) {
          workingStatusesByWorkflow.set(mappedWorkflowId, new Set());
        }
        workingStatusesByWorkflow.get(mappedWorkflowId)!.add(normalized);
      });

      doneStatusIds.forEach(statusId => {
        const { workflowId, statusName } = extractWorkflowAndStatus(statusId);
        const normalized = normalizeStatus(statusName);
        const mappedWorkflowId = workflowId === null ? activeWorkflow.id : workflowId;
        
        if (!doneStatusesByWorkflow.has(mappedWorkflowId)) {
          doneStatusesByWorkflow.set(mappedWorkflowId, new Set());
        }
        doneStatusesByWorkflow.get(mappedWorkflowId)!.add(normalized);
      });

      // Build OR conditions for workflow-status combinations
      const buildRawQueryConditions = (statusesByWorkflow: Map<string, Set<string>>): string => {
        const conditions: string[] = [];
        
        statusesByWorkflow.forEach((statusSetForWorkflow, workflowId) => {
          statusSetForWorkflow.forEach(normalizedStatus => {
            const workflowIdParam = workflowId.replace(/'/g, "''");
            const statusParam = normalizedStatus.replace(/'/g, "''");
            conditions.push(
              `("workflowId" = '${workflowIdParam}' AND UPPER(REPLACE("status", ' ', '_')) = '${statusParam}')`
            );
            if (workflowId !== activeWorkflow.id) {
              const activeWorkflowIdParam = activeWorkflow.id.replace(/'/g, "''");
              conditions.push(
                `("workflowId" = '${activeWorkflowIdParam}' AND UPPER(REPLACE("status", ' ', '_')) = '${statusParam}')`
              );
            }
          });
        });
        
        return conditions.length > 0 ? conditions.join(' OR ') : 'FALSE';
      };

      const workingStatusConditions = buildRawQueryConditions(workingStatusesByWorkflow);
      const doneStatusConditions = buildRawQueryConditions(doneStatusesByWorkflow);

      // Get all tickets grouped by assignedToId using SQL
      const allTicketsQuery = `
        SELECT 
          COALESCE("assignedToId", 'unassigned') as "staffId",
          u.name as "staffName",
          COUNT(*)::int as "all"
        FROM tickets t
        LEFT JOIN users u ON t."assignedToId" = u.id
        GROUP BY COALESCE("assignedToId", 'unassigned'), u.name
      `;

      const allTicketsResult = await this.prisma.$queryRawUnsafe<Array<{
        staffId: string;
        staffName: string | null;
        all: number;
      }>>(allTicketsQuery);

      // Get working tickets grouped by assignedToId
      const workingTicketsQuery = workingStatusConditions !== 'FALSE'
        ? `
          SELECT 
            COALESCE("assignedToId", 'unassigned') as "staffId",
            COUNT(*)::int as "working"
          FROM tickets
          WHERE (${workingStatusConditions})
          GROUP BY COALESCE("assignedToId", 'unassigned')
        `
        : null;

      const workingTicketsResult = workingTicketsQuery
        ? await this.prisma.$queryRawUnsafe<Array<{ staffId: string; working: number }>>(workingTicketsQuery)
        : [];

      // Get done tickets grouped by assignedToId
      const doneTicketsQuery = doneStatusConditions !== 'FALSE'
        ? `
          SELECT 
            COALESCE("assignedToId", 'unassigned') as "staffId",
            COUNT(*)::int as "done"
          FROM tickets
          WHERE (${doneStatusConditions})
          GROUP BY COALESCE("assignedToId", 'unassigned')
        `
        : null;

      const doneTicketsResult = doneTicketsQuery
        ? await this.prisma.$queryRawUnsafe<Array<{ staffId: string; done: number }>>(doneTicketsQuery)
        : [];

      // Get overdue tickets (working status and past due date) grouped by assignedToId
      const overdueTicketsQuery = workingStatusConditions !== 'FALSE'
        ? `
          SELECT 
            COALESCE("assignedToId", 'unassigned') as "staffId",
            COUNT(*)::int as "overdue"
          FROM tickets
          WHERE (${workingStatusConditions})
            AND "dueDate" IS NOT NULL
            AND "dueDate" < NOW()
          GROUP BY COALESCE("assignedToId", 'unassigned')
        `
        : null;

      const overdueTicketsResult = overdueTicketsQuery
        ? await this.prisma.$queryRawUnsafe<Array<{ staffId: string; overdue: number }>>(overdueTicketsQuery)
        : [];

      // Get performance count: done tickets completed before due date OR working tickets not past due
      let performanceResult: Array<{ staffId: string; performanceCount: number }> = [];
      
      if (doneStatusConditions !== 'FALSE' || workingStatusConditions !== 'FALSE') {
        const doneCondition = doneStatusConditions !== 'FALSE' 
          ? `(${doneStatusConditions}) AND ("dueDate" IS NULL OR ("closedAt" IS NOT NULL AND "closedAt" <= "dueDate"))`
          : 'FALSE';
        const workingCondition = workingStatusConditions !== 'FALSE'
          ? `(${workingStatusConditions}) AND ("dueDate" IS NULL OR "dueDate" >= NOW())`
          : 'FALSE';
        
        const performanceQuery = `
          SELECT 
            COALESCE("assignedToId", 'unassigned') as "staffId",
            COUNT(*)::int as "performanceCount"
          FROM tickets
          WHERE (${doneCondition} OR ${workingCondition})
          GROUP BY COALESCE("assignedToId", 'unassigned')
        `;

        performanceResult = await this.prisma.$queryRawUnsafe<Array<{ staffId: string; performanceCount: number }>>(performanceQuery);
      }

      // Build maps for quick lookup
      const workingMap = new Map(workingTicketsResult.map(r => [r.staffId, r.working]));
      const doneMap = new Map(doneTicketsResult.map(r => [r.staffId, r.done]));
      const overdueMap = new Map(overdueTicketsResult.map(r => [r.staffId, r.overdue]));
      const performanceMap = new Map(performanceResult.map(r => [r.staffId, r.performanceCount]));

      // Build result array
      return allTicketsResult.map(staff => {
        const all = staff.all;
        const working = workingMap.get(staff.staffId) || 0;
        const done = doneMap.get(staff.staffId) || 0;
        const hold = all - working - done;
        const overdue = overdueMap.get(staff.staffId) || 0;
        const performanceCount = performanceMap.get(staff.staffId) || 0;

        return {
          name: staff.staffName || 'Unassigned',
          all,
          working,
          done,
          hold,
          overdue,
          performance: all > 0 ? Math.round((performanceCount / all) * 100) : 100,
        };
      }).sort((a, b) => {
        // Sort: Unassigned last, others by name
        if (a.name === 'Unassigned') return 1;
        if (b.name === 'Unassigned') return -1;
        return a.name.localeCompare(b.name);
      });
    } catch (error) {
      console.error('Error in getStaffPerformance:', error);
      throw error;
    }
  }
}
