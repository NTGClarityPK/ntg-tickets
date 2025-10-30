import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum UserRole {
  END_USER = 'END_USER',
  SUPPORT_STAFF = 'SUPPORT_STAFF',
  SUPPORT_MANAGER = 'SUPPORT_MANAGER',
  ADMIN = 'ADMIN'
}

export class CreateUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com'
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'Password123!',
    minLength: 8
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @ApiProperty({
    description: 'User full name',
    example: 'John Doe'
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'User roles',
    example: ['END_USER'],
    enum: UserRole,
    isArray: true
  })
  @IsOptional()
  @IsEnum(UserRole, { each: true })
  roles?: UserRole[];

  @ApiPropertyOptional({
    description: 'User avatar URL',
    example: 'https://example.com/avatar.jpg'
  })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({
    description: 'User active status',
    example: true,
    default: true
  })
  @IsOptional()
  isActive?: boolean;
}
