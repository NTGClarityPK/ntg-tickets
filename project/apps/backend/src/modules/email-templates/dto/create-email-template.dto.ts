import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateEmailTemplateDto {
  @IsString()
  name: string;

  @IsString()
  type: string;

  @IsString()
  subject: string;

  @IsString()
  html: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
