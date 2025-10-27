import { PartialType, ApiProperty } from '@nestjs/swagger';
import { CreateCommentDto } from './create-comment.dto';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateCommentDto extends PartialType(CreateCommentDto) {
  @ApiProperty({
    description: 'Updated comment content',
    example: 'Updated: I have restarted the email service. Please try again.',
    minLength: 1,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MinLength(1)
  content?: string;
}
