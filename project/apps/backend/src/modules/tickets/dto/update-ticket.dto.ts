import { PartialType, ApiProperty } from '@nestjs/swagger';
import { CreateTicketDto } from './create-ticket.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateTicketDto extends PartialType(CreateTicketDto) {
  @ApiProperty({
    description: 'Ticket status (supports custom workflow statuses)',
    type: String,
    example: 'IN_PROGRESS',
    required: false,
  })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({
    description: 'Resolution details',
    example: 'Issue resolved by restarting the email service',
    required: false,
  })
  @IsOptional()
  resolution?: string;
}
