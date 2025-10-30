import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { WorkflowsService } from './workflows.service';
import { 
  Workflow, 
  CreateWorkflowInput, 
  UpdateWorkflowInput,
  CreateWorkflowTransitionInput,
  ExecuteTransitionInput,
  WorkflowTransition
} from './workflow.schema';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Resolver(() => Workflow)
@UseGuards(JwtAuthGuard, RolesGuard)
export class WorkflowsResolver {
  constructor(private readonly workflowsService: WorkflowsService) {}

  @Mutation(() => Workflow)
  @Roles(UserRole.ADMIN)
  createWorkflow(
    @Args('createWorkflowInput') createWorkflowInput: CreateWorkflowInput,
    @CurrentUser() user: any,
  ) {
    return this.workflowsService.create(createWorkflowInput, user.id);
  }

  @Query(() => [Workflow], { name: 'workflows' })
  @Roles(UserRole.ADMIN, UserRole.SUPPORT_MANAGER)
  findAll() {
    return this.workflowsService.findAll();
  }

  @Query(() => Workflow, { name: 'workflow' })
  @Roles(UserRole.ADMIN, UserRole.SUPPORT_MANAGER)
  findOne(@Args('id') id: string) {
    return this.workflowsService.findOne(id);
  }

  @Query(() => Workflow, { name: 'defaultWorkflow' })
  @Roles(UserRole.ADMIN, UserRole.SUPPORT_MANAGER, UserRole.SUPPORT_STAFF)
  findDefault() {
    return this.workflowsService.findDefault();
  }

  @Mutation(() => Workflow)
  @Roles(UserRole.ADMIN)
  updateWorkflow(
    @Args('id') id: string,
    @Args('updateWorkflowInput') updateWorkflowInput: UpdateWorkflowInput,
    @CurrentUser() user: any,
  ) {
    return this.workflowsService.update(id, updateWorkflowInput, user.id);
  }

  @Mutation(() => Boolean)
  @Roles(UserRole.ADMIN)
  removeWorkflow(@Args('id') id: string) {
    return this.workflowsService.remove(id).then(() => true);
  }

  @Mutation(() => Workflow)
  @Roles(UserRole.ADMIN)
  activateWorkflow(@Args('id') id: string) {
    return this.workflowsService.activate(id);
  }

  @Mutation(() => Workflow)
  @Roles(UserRole.ADMIN)
  deactivateWorkflow(@Args('id') id: string) {
    return this.workflowsService.deactivate(id);
  }

  @Mutation(() => Workflow)
  @Roles(UserRole.ADMIN)
  setWorkflowAsDefault(@Args('id') id: string) {
    return this.workflowsService.setAsDefault(id);
  }

  @Mutation(() => WorkflowTransition)
  @Roles(UserRole.ADMIN)
  addWorkflowTransition(
    @Args('workflowId') workflowId: string,
    @Args('createTransitionInput') createTransitionInput: CreateWorkflowTransitionInput,
  ) {
    return this.workflowsService.addTransition(workflowId, createTransitionInput);
  }

  @Mutation(() => WorkflowTransition)
  @Roles(UserRole.ADMIN)
  updateWorkflowTransition(
    @Args('transitionId') transitionId: string,
    @Args('updateData') updateData: CreateWorkflowTransitionInput,
  ) {
    return this.workflowsService.updateTransition(transitionId, updateData);
  }

  @Mutation(() => Boolean)
  @Roles(UserRole.ADMIN)
  removeWorkflowTransition(@Args('transitionId') transitionId: string) {
    return this.workflowsService.removeTransition(transitionId).then(() => true);
  }

  @Query(() => Boolean)
  @Roles(UserRole.ADMIN, UserRole.SUPPORT_MANAGER, UserRole.SUPPORT_STAFF)
  canExecuteTransition(
    @Args('workflowId') workflowId: string,
    @Args('fromState') fromState: string,
    @Args('toState') toState: string,
    @CurrentUser() user: any,
  ) {
    return this.workflowsService.canExecuteTransition(
      workflowId,
      fromState,
      toState,
      user.roles[0],
    );
  }

  @Mutation(() => Boolean)
  @Roles(UserRole.ADMIN, UserRole.SUPPORT_MANAGER, UserRole.SUPPORT_STAFF)
  executeTransition(
    @Args('workflowId') workflowId: string,
    @Args('executeTransitionInput') executeTransitionInput: ExecuteTransitionInput,
    @CurrentUser() user: any,
  ) {
    return this.workflowsService.executeTransition(
      executeTransitionInput.ticketId,
      workflowId,
      executeTransitionInput.fromState,
      executeTransitionInput.toState,
      user.id,
      executeTransitionInput.comment,
    ).then(() => true);
  }
}
