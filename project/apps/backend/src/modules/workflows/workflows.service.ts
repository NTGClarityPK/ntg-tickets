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
    const { definition, ...workflowData } = createWorkflowDto;

    // If this is set as default, unset other default workflows
    if (workflowData.isDefault) {
      await this.prisma.workflow.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

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

    return workflow;
  }

  async findAll() {
    return this.prisma.workflow.findMany({
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
    return this.prisma.workflow.findFirst({
      where: { 
        isDefault: true,
        status: WorkflowStatus.ACTIVE,
      },
      include: {
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

    // Check if workflow is being used by any tickets
    const ticketCount = await this.prisma.ticket.count({
      where: { workflowId: id },
    });

    if (ticketCount > 0) {
      throw new BadRequestException(
        `Cannot delete workflow. It is currently being used by ${ticketCount} ticket(s).`
      );
    }

    return this.prisma.workflow.delete({
      where: { id },
    });
  }

  async activate(id: string) {
    const workflow = await this.findOne(id);
    
    return this.prisma.workflow.update({
      where: { id },
      data: { status: WorkflowStatus.ACTIVE },
    });
  }

  async deactivate(id: string) {
    const workflow = await this.findOne(id);
    
    return this.prisma.workflow.update({
      where: { id },
      data: { status: WorkflowStatus.INACTIVE },
    });
  }

  async setAsDefault(id: string) {
    const workflow = await this.findOne(id);

    // Unset other default workflows
    await this.prisma.workflow.updateMany({
      where: { isDefault: true },
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
