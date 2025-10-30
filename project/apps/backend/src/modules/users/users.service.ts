import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ValidationService } from '../../common/validation/validation.service';
import * as bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private prisma: PrismaService,
    private validationService: ValidationService
  ) {}

  async create(
    createUserDto: CreateUserDto
  ): Promise<{
    id: string;
    email: string;
    name: string;
    roles: string[];
    isActive: boolean;
  }> {
    try {
      // Validate password
      if (!createUserDto.password) {
        throw new BadRequestException('Password is required');
      }

      const passwordValidation = this.validationService.validatePassword(
        createUserDto.password
      );
      if (!passwordValidation.isValid) {
        throw new BadRequestException(passwordValidation.message);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(createUserDto.password, 12);

      const user = await this.prisma.user.create({
        data: {
          ...createUserDto,
          password: hashedPassword,
        },
        include: {
          requestedTickets: {
            select: { id: true, status: true },
          },
          assignedTickets: {
            select: { id: true, status: true },
          },
        },
      });

      // Remove password from response
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...userWithoutPassword } = user;
      this.logger.log(`User created: ${user.email}`);
      return userWithoutPassword as unknown as User;
    } catch (error) {
      this.logger.error('Error creating user:', error);
      throw error;
    }
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: UserRole;
    isActive?: boolean;
  }): Promise<{
    data: {
      id: string;
      email: string;
      name: string;
      roles: string[];
      isActive: boolean;
    }[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const { page = 1, limit = 20, search, role, isActive } = params;

      // Ensure page is a valid number
      const validPage = isNaN(Number(page)) ? 1 : Math.max(1, Number(page));
      const validLimit = isNaN(Number(limit)) ? 20 : Math.max(1, Number(limit));
      const skip = (validPage - 1) * validLimit;

      const where: {
        OR?: Array<
          | { name: { contains: string; mode: 'insensitive' } }
          | { email: { contains: string; mode: 'insensitive' } }
        >;
        roles?: {
          has: 'END_USER' | 'SUPPORT_STAFF' | 'SUPPORT_MANAGER' | 'ADMIN';
        };
        isActive?: boolean;
      } = {};

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (role) {
        where.roles = { has: role };
      }

      if (isActive !== undefined) {
        where.isActive = isActive;
      }

      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          skip,
          take: validLimit,
          orderBy: { createdAt: 'desc' },
          include: {
            requestedTickets: {
              select: { id: true, status: true },
            },
            assignedTickets: {
              select: { id: true, status: true },
            },
          },
        }),
        this.prisma.user.count({ where }),
      ]);

      return {
        data: users,
        pagination: {
          page: validPage,
          limit: validLimit,
          total,
          totalPages: Math.ceil(total / validLimit),
        },
      };
    } catch (error) {
      this.logger.error('Error finding users:', error);
      throw error;
    }
  }

  async findOne(
    id: string
  ): Promise<{
    id: string;
    email: string;
    name: string;
    roles: string[];
    isActive: boolean;
  } | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        include: {
          requestedTickets: {
            select: { id: true, status: true },
          },
          assignedTickets: {
            select: { id: true, status: true },
          },
        },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      return user;
    } catch (error) {
      this.logger.error('Error finding user:', error);
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
        include: {
          requestedTickets: {
            select: { id: true, status: true },
          },
          assignedTickets: {
            select: { id: true, status: true },
          },
        },
      });

      return user;
    } catch (error) {
      this.logger.error('Error finding user by email:', error);
      throw error;
    }
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto
  ): Promise<{
    id: string;
    email: string;
    name: string;
    roles: string[];
    isActive: boolean;
  }> {
    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: {
          ...updateUserDto,
          updatedAt: new Date(),
        },
        include: {
          requestedTickets: {
            select: { id: true, status: true },
          },
          assignedTickets: {
            select: { id: true, status: true },
          },
        },
      });

      this.logger.log(`User updated: ${user.email}`);
      return user;
    } catch (error) {
      this.logger.error('Error updating user:', error);
      throw error;
    }
  }

  async remove(
    id: string
  ): Promise<{
    id: string;
    email: string;
    name: string;
    roles: string[];
    isActive: boolean;
  }> {
    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: {
          isActive: false,
          updatedAt: new Date(),
        },
        include: {
          requestedTickets: {
            select: { id: true, status: true },
          },
          assignedTickets: {
            select: { id: true, status: true },
          },
        },
      });

      this.logger.log(`User deactivated: ${user.email}`);
      return user;
    } catch (error) {
      this.logger.error('Error deactivating user:', error);
      throw error;
    }
  }

  async getUsersByRole(
    role: UserRole
  ): Promise<
    {
      id: string;
      email: string;
      name: string;
      roles: string[];
      isActive: boolean;
    }[]
  > {
    try {
      const users = await this.prisma.user.findMany({
        where: {
          roles: { has: role },
          isActive: true,
        },
        include: {
          requestedTickets: {
            select: { id: true, status: true },
          },
          assignedTickets: {
            select: { id: true, status: true },
          },
        },
        orderBy: { name: 'asc' },
      });

      return users;
    } catch (error) {
      this.logger.error('Error getting users by role:', error);
      throw error;
    }
  }

  async getSupportStaff(): Promise<
    {
      id: string;
      email: string;
      name: string;
      roles: string[];
      isActive: boolean;
      openTicketCount: number;
    }[]
  > {
    try {
      const users = await this.prisma.user.findMany({
        where: {
          roles: { has: UserRole.SUPPORT_STAFF },
          isActive: true,
        },
        include: {
          assignedTickets: {
            where: {
              status: {
                in: ['NEW', 'OPEN', 'IN_PROGRESS', 'REOPENED'],
              },
            },
            select: { id: true },
          },
        },
        orderBy: { name: 'asc' },
      });

      return users
        .map(user => ({
          id: user.id,
          email: user.email,
          name: user.name,
          roles: user.roles,
          isActive: user.isActive,
          openTicketCount: user.assignedTickets.length,
        }))
        .sort((a, b) => {
          // First sort by ticket count (ascending - least tickets first)
          if (a.openTicketCount !== b.openTicketCount) {
            return a.openTicketCount - b.openTicketCount;
          }
          // If ticket counts are equal, sort by name alphabetically
          return a.name.localeCompare(b.name);
        });
    } catch (error) {
      this.logger.error('Error getting support staff with ticket counts:', error);
      throw error;
    }
  }

  async getSupportManagers(): Promise<
    {
      id: string;
      email: string;
      name: string;
      roles: string[];
      isActive: boolean;
      openTicketCount: number;
    }[]
  > {
    try {
      const users = await this.prisma.user.findMany({
        where: {
          roles: { has: UserRole.SUPPORT_MANAGER },
          isActive: true,
        },
        include: {
          assignedTickets: {
            where: {
              status: {
                in: ['NEW', 'OPEN', 'IN_PROGRESS', 'REOPENED'],
              },
            },
            select: { id: true },
          },
        },
        orderBy: { name: 'asc' },
      });

      return users
        .map(user => ({
          id: user.id,
          email: user.email,
          name: user.name,
          roles: user.roles,
          isActive: user.isActive,
          openTicketCount: user.assignedTickets.length,
        }))
        .sort((a, b) => {
          // First sort by ticket count (ascending - least tickets first)
          if (a.openTicketCount !== b.openTicketCount) {
            return a.openTicketCount - b.openTicketCount;
          }
          // If ticket counts are equal, sort by name alphabetically
          return a.name.localeCompare(b.name);
        });
    } catch (error) {
      this.logger.error('Error getting support managers with ticket counts:', error);
      throw error;
    }
  }

  async getAdmins(): Promise<
    {
      id: string;
      email: string;
      name: string;
      roles: string[];
      isActive: boolean;
    }[]
  > {
    return this.getUsersByRole(UserRole.ADMIN);
  }
}
