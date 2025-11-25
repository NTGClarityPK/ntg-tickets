import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { WorkflowsService } from './workflows.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class WorkflowExecutionService {
  constructor(
    private prisma: PrismaService,
    private workflowsService: WorkflowsService,
  ) {}

  async executeTicketTransition(
    ticketId: string,
    newStatus: string,
    userId: string,
    userRole: UserRole,
    comment?: string,
    resolution?: string,
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

    // Priority: Use workflow snapshot if available (preserves workflow state at ticket creation)
    // This allows old tickets to continue using their original workflow even if it becomes inactive
    let workflow = null;
    let usingSnapshot = false;
    
    if (ticket.workflowSnapshot) {
      // Use the snapshot - this is the workflow state when the ticket was created
      const snapshot = ticket.workflowSnapshot as any;
      workflow = {
        id: ticket.workflowId || 'snapshot',
        name: snapshot.name || 'Captured Workflow',
        status: snapshot.status || 'ACTIVE',
        isActive: snapshot.isActive !== false, // Default to true for snapshots
        isDefault: snapshot.isDefault || false,
        isSystemDefault: snapshot.isSystemDefault || false,
        definition: snapshot.definition,
        version: snapshot.version || ticket.workflowVersion || 1,
        transitions: [], // Snapshots don't have transitions, only definition
      };
      usingSnapshot = true;
    } else if (ticket.workflow) {
      // Use current workflow from database
      workflow = ticket.workflow;
    } else {
      // No workflow assigned - get default workflow
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

    // Only validate that the workflow is active if we're using the current workflow (not a snapshot)
    // Snapshots preserve the workflow state at creation time, so they should always be usable
    if (!usingSnapshot && workflow && workflow.status !== 'ACTIVE' && !workflow.isActive) {
      throw new BadRequestException(
        `Workflow "${workflow.name}" is not active. Status: ${workflow.status}, IsActive: ${workflow.isActive}`
      );
    }

    // Find the transition details from the workflow definition (for visual workflows)
    // or from the database table (for legacy workflows)
    let transition = null;
    let transitionConditions = [];
    
    // Check if workflow has a definition (visual workflow)
    if (workflow.definition && workflow.definition['edges']) {
      const definition = workflow.definition as any;
      
      // Normalize status names for comparison - handle various formats
      const normalizeStatus = (status: string) => {
        if (!status) return '';
        // Convert to lowercase, replace spaces and hyphens with underscores
        return status.toLowerCase().replace(/[\s-]+/g, '_').trim();
      };
      
      const normalizedCurrentStatus = normalizeStatus(ticket.status);
      const normalizedNewStatus = normalizeStatus(newStatus);
      
      // Build a map of node IDs and labels for faster lookup
      const nodeMap = new Map<string, string[]>();
      if (definition.nodes) {
        definition.nodes.forEach((node: any) => {
          const normalizedId = normalizeStatus(node.id);
          const normalizedLabel = node.data?.label ? normalizeStatus(node.data.label) : normalizedId;
          const variations = [normalizedId, normalizedLabel];
          // Also add the original status format if it's different
          if (node.data?.label) {
            variations.push(normalizeStatus(node.data.label));
          }
          nodeMap.set(node.id, [...new Set(variations)]);
        });
      }
      
      // Find the edge/transition in the definition
      const edge = definition.edges.find((e: any) => {
        // Skip create transitions
        if (e.source === 'create' || e.data?.isCreateTransition) {
          return false;
        }
        
        // Get all possible variations for source and target
        const sourceVariations = nodeMap.get(e.source) || [normalizeStatus(e.source)];
        const targetVariations = nodeMap.get(e.target) || [normalizeStatus(e.target)];
        
        // Also check node labels directly
        const sourceNode = definition.nodes?.find((n: any) => n.id === e.source);
        const targetNode = definition.nodes?.find((n: any) => n.id === e.target);
        
        if (sourceNode?.data?.label) {
          sourceVariations.push(normalizeStatus(sourceNode.data.label));
        }
        if (targetNode?.data?.label) {
          targetVariations.push(normalizeStatus(targetNode.data.label));
        }
        
        // Check if current status matches any source variation
        const sourceMatches = sourceVariations.some(variation => variation === normalizedCurrentStatus);
        // Check if new status matches any target variation
        const targetMatches = targetVariations.some(variation => variation === normalizedNewStatus);
        
        return sourceMatches && targetMatches;
      });
      
      if (!edge) {
        // Provide more helpful error message with available transitions
        const availableTransitions = definition.edges
          .filter((e: any) => e.source !== 'create' && !e.data?.isCreateTransition)
          .map((e: any) => {
            const sourceNode = definition.nodes?.find((n: any) => n.id === e.source);
            const targetNode = definition.nodes?.find((n: any) => n.id === e.target);
            return `${sourceNode?.data?.label || e.source} -> ${targetNode?.data?.label || e.target}`;
          })
          .join(', ');
        
        throw new BadRequestException(
          `No transition defined from "${ticket.status}" to "${newStatus}" in the workflow. ` +
          `Available transitions: ${availableTransitions || 'none'}`
        );
      }
      
      // Check if user's role is allowed
      const allowedRoles = edge.data?.roles || [];
      if (!allowedRoles.includes(userRole)) {
        throw new ForbiddenException(
          `Transition from ${ticket.status} to ${newStatus} is not allowed for your role`
        );
      }
      
      // Extract conditions from edge data
      const edgeConditions = edge.data?.conditions || [];
      transitionConditions = edgeConditions.map((condition: string) => ({
        type: condition,
        isActive: true,
      }));
      
      // Create a pseudo-transition object for compatibility
      transition = {
        id: `visual-${edge.id}`,
        name: edge.label || `${ticket.status} to ${newStatus}`,
        fromState: ticket.status,
        toState: newStatus,
        conditions: transitionConditions,
        actions: [], // Visual workflows don't have actions yet
      };
    } else {
      // Legacy: Check database table for transitions
      transition = await this.prisma.workflowTransition.findFirst({
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
      
      transitionConditions = transition.conditions;
    }

    // Check conditions (pass comment and resolution for validation)
    await this.validateTransitionConditions(ticket, transitionConditions, comment, resolution);

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
        ...(newStatus === 'CLOSED' && { closedAt: new Date() }),
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

    // If a comment was provided, add it to the ticket
    if (comment && comment.trim().length > 0) {
      await this.prisma.comment.create({
        data: {
          ticketId,
          userId,
          content: comment,
        },
      });
    }

    // If resolution was provided, update the ticket
    if (resolution && resolution.trim().length > 0 && !ticket.resolution) {
      await this.prisma.ticket.update({
        where: { id: ticketId },
        data: { resolution },
      });
    }

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
    comment?: string,
    resolution?: string,
  ): Promise<void> {
    for (const condition of conditions) {
      if (!condition.isActive) continue;

      switch (condition.type) {
        case 'REQUIRES_COMMENT':
          if (!comment || comment.trim().length === 0) {
            throw new BadRequestException(
              'A comment is required to perform this transition. Please provide a reason or note for the status change.'
            );
          }
          break;
        case 'REQUIRES_RESOLUTION':
          const currentResolution = resolution || ticket.resolution;
          if (!currentResolution || currentResolution.trim().length === 0) {
            throw new BadRequestException(
              'A resolution description is required for this transition. Please describe how the issue was resolved.'
            );
          }
          break;
        case 'REQUIRES_ASSIGNMENT':
          if (!ticket.assignedToId) {
            throw new BadRequestException(
              'This ticket must be assigned to a team member before this transition can be performed.'
            );
          }
          break;
        case 'REQUIRES_APPROVAL':
          // This would need to be implemented based on your approval system
          // Check if ticket has an approval record
          throw new BadRequestException(
            'This transition requires approval from a manager or authorized person.'
          );
          break;
        case 'PRIORITY_HIGH':
          if (ticket.priority !== 'HIGH' && ticket.priority !== 'CRITICAL') {
            throw new BadRequestException(
              'This transition can only be performed on high or critical priority tickets.'
            );
          }
          break;
        case 'CUSTOM_FIELD_VALUE':
          // This would check specific custom field values
          const requiredField = condition.value;
          if (requiredField) {
            // Implementation would depend on your custom fields structure
            throw new BadRequestException(
              `Required field "${requiredField}" must be filled before this transition.`
            );
          }
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
