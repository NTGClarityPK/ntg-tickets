import { PartialType, ApiProperty } from '@nestjs/swagger';
import { CreateTicketDto } from './create-ticket.dto';
import { IsOptional, IsEnum } from 'class-validator';
import { TicketStatus } from '@prisma/client';

export class UpdateTicketDto extends PartialType(CreateTicketDto) {
  @ApiProperty({
    description: 'Ticket status',
    enum: TicketStatus,
    example: TicketStatus.IN_PROGRESS,
    required: false,
  })
  @IsEnum(TicketStatus)
  @IsOptional()
  status?: TicketStatus;

  @ApiProperty({
    description: 'Resolution details',
    example: 'Issue resolved by restarting the email service',
    required: false,
  })
  @IsOptional()
  resolution?: string;
}
