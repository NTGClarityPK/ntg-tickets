import { IsEnum, IsNotEmpty } from 'class-validator';
import { UserRole } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserRoleDto {
  @ApiProperty({
    description: 'User role',
    enum: UserRole,
    example: UserRole.SUPPORT_STAFF,
  })
  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;
}
