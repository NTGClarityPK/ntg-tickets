import { User as PrismaUser, UserRole } from '@prisma/client';

export class User implements PrismaUser {
  id: string;
  email: string;
  name: string;
  password: string;
  roles: UserRole[];
  isActive: boolean;
  avatar: string;
  createdAt: Date;
  updatedAt: Date;
}
