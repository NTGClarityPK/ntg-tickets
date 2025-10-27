import { IsString, IsOptional, IsBoolean, IsObject } from 'class-validator';

export class CreateSavedSearchDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsObject()
  searchCriteria: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
