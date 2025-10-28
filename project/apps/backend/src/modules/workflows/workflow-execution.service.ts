import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { WorkflowsService } from './workflows.service';
import { TicketStatus, UserRole } from '@prisma/client';

@Injectable()
export class WorkflowExecutionService {
  constructor(
    private prisma: PrismaService,
    private workflowsService: WorkflowsService,
  ) {}

  async executeTicketTransition(
    ticketId: string,
    newStatus: TicketStatus,
    userId: string,
    userRole: UserRole,
    comment?: string,
  ) {
    // Get the ticket with its current workflow
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        workflow: {
          include: {
            transitions: {
              include: {
                conditions: true,
                actions: true,
                permissions: true,
              },
            },
          },
        },
      },
    });

    if (!ticket) {
      throw new BadRequestException('Ticket not found');
    }

    // If no workflow is assigned, use the default workflow
    let workflow = ticket.workflow;
    if (!workflow) {
      const defaultWorkflow = await this.workflowsService.findDefault();
      if (!defaultWorkflow) {
        throw new BadRequestException('No default workflow found');
      }
      
      // Assign the default workflow to the ticket
      await this.prisma.ticket.update({
        where: { id: ticketId },
        data: { workflowId: defaultWorkflow.id },
      });
      
      // Fetch the workflow with relations
      workflow = await this.prisma.workflow.findUnique({
        where: { id: defaultWorkflow.id },
        include: {
          transitions: {
            include: {
              conditions: true,
              actions: true,
              permissions: true,
            },
          },
        },
      });
    }

    // Check if the transition is allowed
    const canTransition = await this.workflowsService.canExecuteTransition(
      workflow.id,
      ticket.status,
      newStatus,
      userRole,
    );

    if (!canTransition) {
      throw new ForbiddenException(
        `Transition from ${ticket.status} to ${newStatus} is not allowed for your role`
      );
    }

    // Find the transition details
    const transition = await this.prisma.workflowTransition.findFirst({
      where: {
        workflowId: workflow.id,
        fromState: ticket.status,
        toState: newStatus,
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
        actions: true,
      },
    });

    if (!transition) {
      throw new BadRequestException('Transition not found or not allowed');
    }

    // Check conditions
    await this.validateTransitionConditions(ticket, transition.conditions);

    // Execute the transition
    const execution = await this.prisma.workflowExecution.create({
      data: {
        ticketId,
        workflowId: workflow.id,
        fromState: ticket.status,
        toState: newStatus,
        transitionId: transition.id,
        executedBy: userId,
        comment,
      },
    });

    // Update the ticket status
    const updatedTicket = await this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: newStatus,
        updatedAt: new Date(),
        ...(newStatus === TicketStatus.CLOSED && { closedAt: new Date() }),
      },
      include: {
        requester: {
          select: { id: true, name: true, email: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
        category: true,
        subcategory: true,
        workflow: true,
      },
    });

    // Execute actions
    await this.executeTransitionActions(updatedTicket, transition.actions, userId);

    // Create ticket history entry
    await this.prisma.ticketHistory.create({
      data: {
        ticketId,
        userId,
        fieldName: 'status',
        oldValue: ticket.status,
        newValue: newStatus,
      },
    });

    return {
      ticket: updatedTicket,
      execution,
      transition: {
        id: transition.id,
        name: transition.name,
        fromState: transition.fromState,
        toState: transition.toState,
      },
    };
  }

  private async validateTransitionConditions(
    ticket: any,
    conditions: any[],
  ): Promise<void> {
    for (const condition of conditions) {
      if (!condition.isRequired) continue;

      switch (condition.type) {
        case 'REQUIRES_COMMENT':
          // This should be checked at the API level before calling this service
          break;
        case 'REQUIRES_RESOLUTION':
          if (!ticket.resolution) {
            throw new BadRequestException('Resolution is required for this transition');
          }
          break;
        case 'REQUIRES_ASSIGNMENT':
          if (!ticket.assignedToId) {
            throw new BadRequestException('Ticket must be assigned before this transition');
          }
          break;
        case 'REQUIRES_APPROVAL':
          // This would need to be implemented based on your approval system
          break;
        case 'PRIORITY_HIGH':
          if (ticket.priority !== 'HIGH' && ticket.priority !== 'CRITICAL') {
            throw new BadRequestException('This transition requires high priority');
          }
          break;
        case 'CUSTOM_FIELD_VALUE':
          // This would need to be implemented based on your custom fields
          break;
      }
    }
  }

  private async executeTransitionActions(
    ticket: any,
    actions: any[],
    userId: string,
  ): Promise<void> {
    for (const action of actions) {
      if (!action.isActive) continue;

      switch (action.type) {
        case 'SEND_NOTIFICATION':
          await this.sendNotification(ticket, action.config);
          break;
        case 'ASSIGN_TO_USER':
          await this.assignToUser(ticket, action.config, userId);
          break;
        case 'CALCULATE_RESOLUTION_TIME':
          await this.calculateResolutionTime(ticket);
          break;
        case 'UPDATE_PRIORITY':
          await this.updatePriority(ticket, action.config);
          break;
        case 'SEND_EMAIL':
          await this.sendEmail(ticket, action.config);
          break;
        case 'LOG_ACTIVITY':
          await this.logActivity(ticket, action.config, userId);
          break;
      }
    }
  }

  private async sendNotification(ticket: any, config: any): Promise<void> {
    // Implementation would depend on your notification system
    console.log(`Sending notification for ticket ${ticket.id}`, config);
  }

  private async assignToUser(ticket: any, config: any, userId: string): Promise<void> {
    if (config.assignToCurrentUser) {
      await this.prisma.ticket.update({
        where: { id: ticket.id },
        data: { assignedToId: userId },
      });
    }
  }

  private async calculateResolutionTime(ticket: any): Promise<void> {
    if (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') {
      const resolutionTime = new Date().getTime() - new Date(ticket.createdAt).getTime();
      // Store resolution time in a custom field or separate table
      console.log(`Resolution time: ${resolutionTime}ms`);
    }
  }

  private async updatePriority(ticket: any, config: any): Promise<void> {
    if (config.newPriority) {
      await this.prisma.ticket.update({
        where: { id: ticket.id },
        data: { priority: config.newPriority },
      });
    }
  }

  private async sendEmail(ticket: any, config: any): Promise<void> {
    // Implementation would depend on your email system
    console.log(`Sending email for ticket ${ticket.id}`, config);
  }

  private async logActivity(ticket: any, config: any, userId: string): Promise<void> {
    await this.prisma.ticketHistory.create({
      data: {
        ticketId: ticket.id,
        userId,
        fieldName: 'workflow_action',
        newValue: config.message || 'Workflow action executed',
      },
    });
  }

  // Method to get available transitions for a ticket
  async getAvailableTransitions(ticketId: string, userRole: UserRole) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        workflow: {
          include: {
            transitions: {
              include: {
                conditions: true,
                permissions: true,
              },
            },
          },
        },
      },
    });

    if (!ticket) {
      throw new BadRequestException('Ticket not found');
    }

    let workflow = ticket.workflow;
    if (!workflow) {
      const defaultWorkflow = await this.workflowsService.findDefault();
      if (!defaultWorkflow) {
        return [];
      }
      
      // Fetch the workflow with relations
      workflow = await this.prisma.workflow.findUnique({
        where: { id: defaultWorkflow.id },
        include: {
          transitions: {
            include: {
              conditions: true,
              permissions: true,
            },
          },
        },
      });
    }

    const availableTransitions = workflow.transitions.filter((transition) => {
      // Check if user role can execute this transition
      const hasPermission = transition.permissions.some(
        (permission) => permission.role === userRole && permission.canExecute
      );

      return (
        transition.isActive &&
        transition.fromState === ticket.status &&
        hasPermission
      );
    });

    return availableTransitions.map((transition) => ({
      id: transition.id,
      name: transition.name,
      toState: transition.toState,
      description: transition.description,
      conditions: transition.conditions,
    }));
  }
}
