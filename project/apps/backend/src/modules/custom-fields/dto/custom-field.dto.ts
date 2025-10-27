import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsArray,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum CustomFieldType {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  DATE = 'DATE',
  SELECT = 'SELECT',
  BOOLEAN = 'BOOLEAN',
  MULTI_SELECT = 'MULTI_SELECT',
  TEXTAREA = 'TEXTAREA',
}

export class CreateCustomFieldDto {
  @ApiProperty({ description: 'Field name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Field type', enum: CustomFieldType })
  @IsEnum(CustomFieldType)
  fieldType: CustomFieldType;

  @ApiProperty({
    description: 'Field options for SELECT and MULTI_SELECT types',
    required: false,
  })
  @IsOptional()
  @IsArray()
  options?: string[];

  @ApiProperty({
    description: 'Whether the field is required',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiProperty({ description: 'Whether the field is active', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ description: 'Field description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Field category', required: false })
  @IsOptional()
  @IsString()
  category?: string;
}

export class UpdateCustomFieldDto {
  @ApiProperty({ description: 'Field name', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Field type',
    enum: CustomFieldType,
    required: false,
  })
  @IsOptional()
  @IsEnum(CustomFieldType)
  fieldType?: CustomFieldType;

  @ApiProperty({
    description: 'Field options for SELECT and MULTI_SELECT types',
    required: false,
  })
  @IsOptional()
  @IsArray()
  options?: string[];

  @ApiProperty({
    description: 'Whether the field is required',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiProperty({ description: 'Whether the field is active', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ description: 'Field description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Field category', required: false })
  @IsOptional()
  @IsString()
  category?: string;
}
