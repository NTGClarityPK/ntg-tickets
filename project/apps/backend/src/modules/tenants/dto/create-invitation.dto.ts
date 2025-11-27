import { IsString, IsEmail, IsOptional, IsArray, IsEnum } from 'class-validator';
import { UserRole } from '@prisma/client';

export class CreateInvitationDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsArray()
  @IsEnum(UserRole, { each: true })
  roles: UserRole[];
}

