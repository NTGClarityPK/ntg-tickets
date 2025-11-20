import {
  IsString,
  IsEnum,
  IsOptional,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsArray,
  IsObject,
  ValidateIf,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  TicketPriority,
  TicketImpact,
  TicketUrgency,
} from '@prisma/client';

export class CreateTicketDto {
  @ApiProperty({
    description: 'Ticket title',
    example: 'Unable to access email server',
    minLength: 5,
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(200)
  title: string;

  @ApiProperty({
    description: 'Detailed description of the issue',
    example:
      'I am unable to access the email server since this morning. Getting connection timeout errors.',
    minLength: 10,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  description: string;

  @ApiProperty({
    description: 'Ticket category ID',
    example: 'f31997ca-426e-476f-a27e-c532e6f0fb85',
  })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({
    description: 'Ticket subcategory',
    example: 'email_client',
    required: false,
  })
  @IsOptional()
  @ValidateIf((o) => o.subcategory !== undefined && o.subcategory !== null && o.subcategory !== '')
  @IsString()
  subcategory?: string;

  @ApiProperty({
    description: 'Ticket priority',
    enum: TicketPriority,
    example: TicketPriority.MEDIUM,
    default: TicketPriority.MEDIUM,
  })
  @IsEnum(TicketPriority)
  @IsOptional()
  priority?: TicketPriority = TicketPriority.MEDIUM;

  @ApiProperty({
    description: 'Impact level',
    enum: TicketImpact,
    example: TicketImpact.MODERATE,
    default: TicketImpact.MODERATE,
  })
  @IsEnum(TicketImpact)
  @IsOptional()
  impact?: TicketImpact = TicketImpact.MODERATE;

  @ApiProperty({
    description: 'Urgency level',
    enum: TicketUrgency,
    example: TicketUrgency.NORMAL,
    default: TicketUrgency.NORMAL,
  })
  @IsEnum(TicketUrgency)
  @IsOptional()
  urgency?: TicketUrgency = TicketUrgency.NORMAL;

  @ApiProperty({
    description: 'ID of the user assigned to this ticket',
    example: 'user-id-123',
    required: false,
  })
  @IsString()
  @IsOptional()
  assignedToId?: string;

  @ApiProperty({
    description: 'Related ticket IDs',
    type: [String],
    example: ['uuid1', 'uuid2'],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  relatedTickets?: string[];

  @ApiProperty({
    description: 'Custom field values',
    type: 'object',
    example: { department: 'IT', location: 'New York' },
    additionalProperties: true,
  })
  @IsObject()
  @IsOptional()
  customFields?: Record<string, string | number | boolean>;

  @ApiProperty({
    description: 'File attachments',
    type: 'array',
    items: { type: 'string' },
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  attachments?: string[];
}
