import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAttachmentDto {
  @ApiProperty({
    description: 'New filename for the attachment',
    example: 'updated-document.pdf',
    required: false,
  })
  @IsOptional()
  @IsString()
  filename?: string;
}
