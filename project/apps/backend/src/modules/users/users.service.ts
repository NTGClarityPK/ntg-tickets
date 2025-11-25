import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
  HttpException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ValidationService } from '../../common/validation/validation.service';
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

type UserWithoutRelations = Prisma.UserGetPayload<Record<string, never>>;

type SanitizedUser = Omit<UserWithRelations, 'password'>;
type SanitizedUserWithoutRelations = Omit<UserWithoutRelations, 'password'>;

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private prisma: PrismaService,
    private validationService: ValidationService,
    private supabaseService: SupabaseService
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

      // Create user in Supabase Auth first (Option A: Full Supabase Auth)
      const supabase = this.supabaseService.getAdminClient();
      const {
        data: { user: supabaseUser },
        error: authError,
      } = await supabase.auth.admin.createUser({
        email: createUserDto.email,
        password: createUserDto.password,
        email_confirm: true, // Auto-confirm (set to false in production)
        user_metadata: {
          name: createUserDto.name,
          roles: (createUserDto.roles || [UserRole.END_USER]).map((r) =>
            r.toString()
          ),
        },
      });

      if (authError || !supabaseUser) {
        this.logger.error('Error creating Supabase user:', authError);
        throw new BadRequestException(
          authError?.message || 'Failed to create user in Supabase Auth'
        );
      }

      // Create user record in our database with Supabase user ID
      try {
        const user = await this.prisma.user.create({
          data: {
            id: supabaseUser.id, // Use Supabase user ID
            email: supabaseUser.email!,
            name: createUserDto.name,
            password: null, // No password stored - Supabase handles it
            roles: createUserDto.roles || [UserRole.END_USER],
            isActive: true,
          },
        });

        const userWithoutPassword = this.sanitizeUserSimple(user);
        this.logger.log(`User created with Supabase Auth: ${user.email}`);
        return userWithoutPassword;
      } catch (error) {
        // If database creation fails, delete the Supabase user
        await supabase.auth.admin.deleteUser(supabaseUser.id);
        throw error;
      }
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof HttpException
      ) {
        throw error;
      }
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
        }),
        this.prisma.user.count({ where }),
      ]);

      return {
        data: users.map(user => this.sanitizeUserSimple(user)),
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
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      return this.sanitizeUserSimple(user);
    } catch (error) {
      this.handleServiceError(error, 'Failed to find user');
    }
  }

  async findByEmail(email: string): Promise<SanitizedUserWithoutRelations | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      return user ? this.sanitizeUserSimple(user) : null;
    } catch (error) {
      this.handleServiceError(error, 'Failed to find user by email');
    }
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    currentUserId?: string
  ): Promise<{
    id: string;
    email: string;
    name: string;
    roles: string[];
    isActive: boolean;
  }> {
    try {
      // If roles are being updated, validate admin role protection
      if (updateUserDto.roles !== undefined) {
        // Get the current user's roles before update
        const currentUser = await this.prisma.user.findUnique({
          where: { id },
          select: { roles: true, email: true },
        });

        if (!currentUser) {
          throw new NotFoundException(`User with ID ${id} not found`);
        }

        const hadAdminRole = currentUser.roles.includes(UserRole.ADMIN);
        const willHaveAdminRole = updateUserDto.roles.some(role => String(role) === 'ADMIN');

        // Check if admin is trying to remove their own admin role
        if (
          currentUserId &&
          id === currentUserId &&
          hadAdminRole &&
          !willHaveAdminRole
        ) {
          throw new BadRequestException(
            'You cannot remove your own admin role. Please ask another admin to perform this action.'
          );
        }

        // Check if removing admin role would leave system with no admins
        if (hadAdminRole && !willHaveAdminRole) {
          const adminCount = await this.prisma.user.count({
            where: {
              roles: { has: UserRole.ADMIN },
              isActive: true,
            },
          });

          // If this user was the only admin, prevent removal
          if (adminCount === 1) {
            throw new BadRequestException(
              'Cannot remove admin role. This would leave the system with no administrators. Please assign admin role to another user first.'
            );
          }
        }
      }

      const updateData: any = {
        ...updateUserDto,
        updatedAt: new Date(),
      };

      // Handle password update if provided (update in Supabase Auth)
      if (updateUserDto.password) {
        // Validate password
        const passwordValidation = this.validationService.validatePassword(
          updateUserDto.password
        );
        if (!passwordValidation.isValid) {
          throw new BadRequestException(passwordValidation.message);
        }

        // Update password in Supabase Auth
        const supabase = this.supabaseService.getAdminClient();
        const { error: passwordError } = await supabase.auth.admin.updateUserById(
          id,
          {
            password: updateUserDto.password,
          }
        );

        if (passwordError) {
          this.logger.error('Error updating password in Supabase:', passwordError);
          throw new BadRequestException('Failed to update password');
        }

        // Don't store password in our database - Supabase handles it
        delete updateData.password;
      } else {
        // Remove password from update data if not provided
        delete updateData.password;
      }

      const user = await this.prisma.user.update({
        where: { id },
        data: updateData,
      });

      this.logger.log(`User updated: ${user.email}`);
      return this.sanitizeUserSimple(user);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
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
      });

      this.logger.log(`User deactivated: ${user.email}`);
      return this.sanitizeUserSimple(user);
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
        orderBy: { name: 'asc' },
      });

      return users.map(user => this.sanitizeUserSimple(user));
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

  private sanitizeUserSimple(user: UserWithoutRelations): SanitizedUserWithoutRelations {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...safeUser } = user;
    return safeUser as SanitizedUserWithoutRelations;
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
