import { IsString, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { TicketCategory } from '@prisma/client';

export class CreateCategoryDto {
  @IsEnum(TicketCategory)
  name: TicketCategory;

  @IsOptional()
  @IsString()
  customName?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  createdBy?: string;
}
