import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
  HttpException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ValidationService } from '../../common/validation/validation.service';
import * as bcrypt from 'bcryptjs';
import { Prisma, UserRole } from '@prisma/client';
import { GetUsersQueryDto } from './dto/get-users-query.dto';

const USER_TICKET_RELATIONS = {
  requestedTickets: {
    select: { id: true, status: true },
  },
  assignedTickets: {
    select: { id: true, status: true },
  },
} as const;

type UserWithRelations = Prisma.UserGetPayload<{
  include: typeof USER_TICKET_RELATIONS;
}>;

type SanitizedUser = Omit<UserWithRelations, 'password'>;

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
        include: USER_TICKET_RELATIONS,
      });

      const userWithoutPassword = this.sanitizeUser(user);
      this.logger.log(`User created: ${user.email}`);
      return userWithoutPassword;
    } catch (error) {
      this.handleServiceError(error, 'Failed to create user');
    }
  }

  async findAll(params: GetUsersQueryDto): Promise<{
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
      const skip = (page - 1) * limit;

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
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: USER_TICKET_RELATIONS,
        }),
        this.prisma.user.count({ where }),
      ]);

      return {
        data: users.map(user => this.sanitizeUser(user)),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.handleServiceError(error, 'Failed to fetch users');
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
        include: USER_TICKET_RELATIONS,
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      return this.sanitizeUser(user);
    } catch (error) {
      this.handleServiceError(error, 'Failed to find user');
    }
  }

  async findByEmail(email: string): Promise<SanitizedUser | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
        include: USER_TICKET_RELATIONS,
      });

      return user ? this.sanitizeUser(user) : null;
    } catch (error) {
      this.handleServiceError(error, 'Failed to find user by email');
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
      const updateData: any = {
        ...updateUserDto,
        updatedAt: new Date(),
      };

      // Handle password update if provided
      if (updateUserDto.password) {
        // Validate password
        const passwordValidation = this.validationService.validatePassword(
          updateUserDto.password
        );
        if (!passwordValidation.isValid) {
          throw new BadRequestException(passwordValidation.message);
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(updateUserDto.password, 12);
        updateData.password = hashedPassword;
      } else {
        // Remove password from update data if not provided
        delete updateData.password;
      }

      const user = await this.prisma.user.update({
        where: { id },
        data: updateData,
        include: USER_TICKET_RELATIONS,
      });

      this.logger.log(`User updated: ${user.email}`);
      return this.sanitizeUser(user);
    } catch (error) {
      this.handleServiceError(error, 'Failed to update user');
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
        include: USER_TICKET_RELATIONS,
      });

      this.logger.log(`User deactivated: ${user.email}`);
      return this.sanitizeUser(user);
    } catch (error) {
      this.handleServiceError(error, 'Failed to deactivate user');
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
        include: USER_TICKET_RELATIONS,
        orderBy: { name: 'asc' },
      });

      return users.map(user => this.sanitizeUser(user));
    } catch (error) {
      this.handleServiceError(error, 'Failed to get users by role');
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
          ...USER_TICKET_RELATIONS,
          assignedTickets: {
            where: {
              status: {
                in: ['NEW', 'OPEN', 'IN_PROGRESS', 'REOPENED'],
              },
            },
            select: USER_TICKET_RELATIONS.assignedTickets.select,
          },
        },
        orderBy: { name: 'asc' },
      });

      return users
        .map(user => this.sanitizeUser(user))
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
      this.handleServiceError(
        error,
        'Failed to get support staff with ticket counts',
      );
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
          ...USER_TICKET_RELATIONS,
          assignedTickets: {
            where: {
              status: {
                in: ['NEW', 'OPEN', 'IN_PROGRESS', 'REOPENED'],
              },
            },
            select: USER_TICKET_RELATIONS.assignedTickets.select,
          },
        },
        orderBy: { name: 'asc' },
      });

      return users
        .map(user => this.sanitizeUser(user))
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
      this.handleServiceError(
        error,
        'Failed to get support managers with ticket counts',
      );
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

  private sanitizeUser(user: UserWithRelations): SanitizedUser {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...safeUser } = user;
    return safeUser as SanitizedUser;
  }

  private handleServiceError(error: unknown, userMessage: string): never {
    if (error instanceof HttpException) {
      throw error;
    }

    const details =
      error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    this.logger.error(userMessage, details);
    throw new InternalServerErrorException(userMessage);
  }
}
