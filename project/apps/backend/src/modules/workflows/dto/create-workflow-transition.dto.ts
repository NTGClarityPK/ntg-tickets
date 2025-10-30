import { IsString, IsOptional, IsBoolean, IsInt, IsArray, IsEnum } from 'class-validator';
import { UserRole, WorkflowConditionType, WorkflowActionType } from '@prisma/client';

export class CreateWorkflowConditionDto {
  @IsEnum(WorkflowConditionType)
  type: WorkflowConditionType;

  @IsOptional()
  @IsString()
  value?: string;

  @IsOptional()
  @IsString()
  operator?: string;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;
}

export class CreateWorkflowActionDto {
  @IsEnum(WorkflowActionType)
  type: WorkflowActionType;

  @IsOptional()
  config?: any;

  @IsOptional()
  @IsInt()
  order?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateWorkflowPermissionDto {
  @IsEnum(UserRole)
  role: UserRole;

  @IsOptional()
  @IsBoolean()
  canExecute?: boolean;
}

export class CreateWorkflowTransitionDto {
  @IsString()
  fromState: string;

  @IsString()
  toState: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  order?: number;

  @IsOptional()
  @IsArray()
  conditions?: CreateWorkflowConditionDto[];

  @IsOptional()
  @IsArray()
  actions?: CreateWorkflowActionDto[];

  @IsOptional()
  @IsArray()
  permissions?: CreateWorkflowPermissionDto[];
}
