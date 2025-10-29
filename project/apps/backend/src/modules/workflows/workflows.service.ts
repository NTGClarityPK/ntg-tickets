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
      
      const { definition, ...workflowData } = createWorkflowDto;

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

      console.log('💾 Creating workflow in database...');
      const workflow = await this.prisma.workflow.create({
        data: {
          ...workflowData,
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

  async activate(id: string) {
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
    
    console.log(`✅ Activating workflow: ${id}`);
    return this.prisma.workflow.update({
      where: { id },
      data: { status: WorkflowStatus.ACTIVE },
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
}
