import { IsArray, IsOptional, IsString } from 'class-validator';

export class ActivateWorkflowDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  workingStatuses?: string[]; // Statuses that count as "Working" for dashboard stats

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  doneStatuses?: string[]; // Statuses that count as "Done" for dashboard stats
}


