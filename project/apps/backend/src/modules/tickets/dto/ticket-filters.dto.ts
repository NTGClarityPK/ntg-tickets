import {
  IsOptional,
  IsArray,
  IsString,
  IsEnum,
  IsDateString,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { TicketStatus, TicketPriority } from '@prisma/client';

export class TicketFiltersDto {
  @ApiProperty({
    description: 'Page number',
    example: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiProperty({
    description: 'Items per page',
    example: 20,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @ApiProperty({
    description: 'Filter by ticket status',
    enum: TicketStatus,
    isArray: true,
    required: false,
  })
  @IsArray()
  @IsEnum(TicketStatus, { each: true })
  @IsOptional()
  status?: TicketStatus[];

  @ApiProperty({
    description: 'Filter by ticket priority',
    enum: TicketPriority,
    isArray: true,
    required: false,
  })
  @IsArray()
  @IsEnum(TicketPriority, { each: true })
  @IsOptional()
  priority?: TicketPriority[];

  @ApiProperty({
    description: 'Filter by ticket category IDs',
    type: [String],
    required: false,
  })
  @IsArray()
  @IsUUID(4, { each: true })
  @IsOptional()
  category?: string[];

  @ApiProperty({
    description: 'Filter by assigned user IDs',
    type: [String],
    required: false,
  })
  @IsArray()
  @IsUUID(4, { each: true })
  @IsOptional()
  assignedToId?: string[];

  @ApiProperty({
    description: 'Filter by requester user IDs',
    type: [String],
    required: false,
  })
  @IsArray()
  @IsUUID(4, { each: true })
  @IsOptional()
  requesterId?: string[];

  @ApiProperty({
    description: 'Search in title, description, and ticket number',
    example: 'email server',
    required: false,
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({
    description: 'Filter from date (ISO string)',
    example: '2024-01-01T00:00:00.000Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @ApiProperty({
    description: 'Filter to date (ISO string)',
    example: '2024-12-31T23:59:59.999Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  dateTo?: string;
}
