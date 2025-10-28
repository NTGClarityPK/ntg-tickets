import { IsString, IsOptional, IsEnum, IsBoolean, IsInt, IsObject } from 'class-validator';
import { WorkflowStatus } from '@prisma/client';

export class CreateWorkflowDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(WorkflowStatus)
  status?: WorkflowStatus;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsInt()
  version?: number;

  @IsOptional()
  @IsObject()
  definition?: any; // The workflow definition JSON
}
