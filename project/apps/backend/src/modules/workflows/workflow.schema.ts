import { Field, ObjectType, InputType, Int, registerEnumType } from '@nestjs/graphql';
import { WorkflowStatus, WorkflowConditionType, WorkflowActionType, UserRole } from '@prisma/client';

// Register enums
registerEnumType(WorkflowStatus, {
  name: 'WorkflowStatus',
});

registerEnumType(WorkflowConditionType, {
  name: 'WorkflowConditionType',
});

registerEnumType(WorkflowActionType, {
  name: 'WorkflowActionType',
});

registerEnumType(UserRole, {
  name: 'UserRole',
});

@ObjectType()
export class WorkflowCondition {
  @Field()
  id: string;

  @Field()
  transitionId: string;

  @Field(() => WorkflowConditionType)
  type: WorkflowConditionType;

  @Field({ nullable: true })
  value?: string;

  @Field({ nullable: true })
  operator?: string;

  @Field()
  isRequired: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class WorkflowAction {
  @Field()
  id: string;

  @Field()
  transitionId: string;

  @Field(() => WorkflowActionType)
  type: WorkflowActionType;

  @Field({ nullable: true })
  config?: any;

  @Field(() => Int)
  order: number;

  @Field()
  isActive: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class WorkflowPermission {
  @Field()
  id: string;

  @Field()
  transitionId: string;

  @Field(() => UserRole)
  role: UserRole;

  @Field()
  canExecute: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class WorkflowTransition {
  @Field()
  id: string;

  @Field()
  workflowId: string;

  @Field()
  fromState: string;

  @Field()
  toState: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  isActive: boolean;

  @Field(() => Int)
  order: number;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => [WorkflowCondition])
  conditions: WorkflowCondition[];

  @Field(() => [WorkflowAction])
  actions: WorkflowAction[];

  @Field(() => [WorkflowPermission])
  permissions: WorkflowPermission[];
}

@ObjectType()
export class WorkflowCreator {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field()
  email: string;
}

@ObjectType()
export class Workflow {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => WorkflowStatus)
  status: WorkflowStatus;

  @Field()
  isDefault: boolean;

  @Field(() => Int)
  version: number;

  @Field({ nullable: true })
  definition?: any;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field()
  createdBy: string;

  @Field(() => WorkflowCreator)
  creator: WorkflowCreator;

  @Field(() => [WorkflowTransition])
  transitions: WorkflowTransition[];

  @Field(() => Int)
  ticketCount: number;
}

@InputType()
export class CreateWorkflowConditionInput {
  @Field(() => WorkflowConditionType)
  type: WorkflowConditionType;

  @Field({ nullable: true })
  value?: string;

  @Field({ nullable: true })
  operator?: string;

  @Field({ defaultValue: true })
  isRequired?: boolean;
}

@InputType()
export class CreateWorkflowActionInput {
  @Field(() => WorkflowActionType)
  type: WorkflowActionType;

  @Field({ nullable: true })
  config?: any;

  @Field({ defaultValue: 0 })
  order?: number;

  @Field({ defaultValue: true })
  isActive?: boolean;
}

@InputType()
export class CreateWorkflowPermissionInput {
  @Field(() => UserRole)
  role: UserRole;

  @Field({ defaultValue: true })
  canExecute?: boolean;
}

@InputType()
export class CreateWorkflowTransitionInput {
  @Field()
  fromState: string;

  @Field()
  toState: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ defaultValue: true })
  isActive?: boolean;

  @Field({ defaultValue: 0 })
  order?: number;

  @Field(() => [CreateWorkflowConditionInput], { nullable: true })
  conditions?: CreateWorkflowConditionInput[];

  @Field(() => [CreateWorkflowActionInput], { nullable: true })
  actions?: CreateWorkflowActionInput[];

  @Field(() => [CreateWorkflowPermissionInput], { nullable: true })
  permissions?: CreateWorkflowPermissionInput[];
}

@InputType()
export class CreateWorkflowInput {
  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => WorkflowStatus, { defaultValue: WorkflowStatus.DRAFT })
  status?: WorkflowStatus;

  @Field({ defaultValue: false })
  isDefault?: boolean;

  @Field({ defaultValue: 1 })
  version?: number;

  @Field({ nullable: true })
  definition?: any;
}

@InputType()
export class UpdateWorkflowInput {
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => WorkflowStatus, { nullable: true })
  status?: WorkflowStatus;

  @Field({ nullable: true })
  isDefault?: boolean;

  @Field({ nullable: true })
  definition?: any;
}

@InputType()
export class ExecuteTransitionInput {
  @Field()
  ticketId: string;

  @Field()
  fromState: string;

  @Field()
  toState: string;

  @Field({ nullable: true })
  comment?: string;
}
