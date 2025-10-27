import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class AssignTicketDto {
  @ApiProperty({
    description: 'ID of the user to assign the ticket to',
    example: '93fd2d5a-bba4-4a96-a5d0-14bfe5ff2e4e',
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  assignedToId: string;
}
