import { IsString, IsOptional, IsEnum, IsBoolean, IsInt, IsObject, IsArray } from 'class-validator';
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

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  workingStatuses?: string[]; // Statuses that count as "Working" for dashboard stats

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  doneStatuses?: string[]; // Statuses that count as "Done" for dashboard stats
}
