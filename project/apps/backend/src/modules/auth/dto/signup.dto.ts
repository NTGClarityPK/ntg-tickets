import { IsString, IsEmail, MinLength, Matches, IsOptional } from 'class-validator';

export class SignupDto {
  @IsString()
  organizationName: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: 'Slug must contain only lowercase letters, numbers, and hyphens' })
  organizationSlug?: string;

  @IsString()
  adminName: string;

  @IsEmail()
  adminEmail: string;

  @IsString()
  @MinLength(8)
  password: string;
}

