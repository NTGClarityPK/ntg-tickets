import { UserRole } from '@prisma/client';

export class User {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  roles: UserRole[];
  isActive: boolean;
  avatar: string | null;
  createdAt: Date;
  updatedAt: Date;
}
