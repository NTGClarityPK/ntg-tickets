import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsArray,
  IsNotEmpty,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CustomFieldType } from '@prisma/client';

export class CreateCustomFieldDto {
  @ApiProperty({
    description: 'Custom field name',
    example: 'Department',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Custom field type',
    enum: CustomFieldType,
    example: CustomFieldType.SELECT,
  })
  @IsEnum(CustomFieldType)
  fieldType: CustomFieldType;

  @ApiProperty({
    description: 'Options for SELECT field type',
    example: ['IT', 'HR', 'Finance', 'Marketing'],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  options?: string[];

  @ApiProperty({
    description: 'Whether this field is required',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isRequired?: boolean = false;

  @ApiProperty({
    description: 'Whether this field is active',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}
