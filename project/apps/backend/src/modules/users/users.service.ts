import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ValidationService } from '../../common/validation/validation.service';
import * as bcrypt from 'bcryptjs';

// Define UserRole enum locally
enum UserRole {
  END_USER = 'END_USER',
  SUPPORT_STAFF = 'SUPPORT_STAFF',
  SUPPORT_MANAGER = 'SUPPORT_MANAGER',
  ADMIN = 'ADMIN',
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private supabase: SupabaseService,
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

      // Hash password (Supabase Auth will handle this, but for compatibility keep it)
      const hashedPassword = await bcrypt.hash(createUserDto.password, 12);

      const { data: user, error } = await this.supabase.client
        .from('users')
        .insert({
          email: createUserDto.email,
          name: createUserDto.name,
          password: hashedPassword, // Note: With Supabase Auth, password should be null
          roles: createUserDto.roles || ['END_USER'],
          is_active: createUserDto.isActive ?? true,
        })
        .select(`
          *,
          requested_tickets:tickets!requester_id (id, status),
          assigned_tickets:tickets!assigned_to_id (id, status)
        `)
        .single();

      if (error) {
        this.logger.error('Error creating user:', error);
        throw error;
      }

      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      this.logger.log(`User created: ${user.email}`);
      return this.mapUser(userWithoutPassword);
    } catch (error) {
      this.logger.error('Error creating user:', error);
      throw error;
    }
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string | UserRole;
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
      const from = (validPage - 1) * validLimit;
      const to = from + validLimit - 1;

      let query = this.supabase.client
        .from('users')
        .select(`
          *,
          requested_tickets:tickets!requester_id (id, status),
          assigned_tickets:tickets!assigned_to_id (id, status)
        `, { count: 'exact' })
        .range(from, to)
        .order('created_at', { ascending: false });

      // Apply search filter
      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      // Apply role filter
      if (role) {
        const roleStr = typeof role === 'string' ? role : role;
        query = query.contains('roles', [roleStr]);
      }

      // Apply isActive filter
      if (isActive !== undefined) {
        query = query.eq('is_active', isActive);
      }

      const { data: users, error, count } = await query;

      if (error) {
        this.logger.error('Error finding users:', error);
        throw error;
      }

      return {
        data: (users || []).map(this.mapUser),
        pagination: {
          page: validPage,
          limit: validLimit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / validLimit),
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
      const { data: user, error } = await this.supabase.client
        .from('users')
        .select(`
          *,
          requested_tickets:tickets!requester_id (id, status),
          assigned_tickets:tickets!assigned_to_id (id, status)
        `)
        .eq('id', id)
        .single();

      if (error || !user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      return this.mapUser(user);
    } catch (error) {
      this.logger.error('Error finding user:', error);
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const { data: user, error } = await this.supabase.client
        .from('users')
        .select(`
          *,
          requested_tickets:tickets!requester_id (id, status),
          assigned_tickets:tickets!assigned_to_id (id, status)
        `)
        .eq('email', email)
        .single();

      if (error || !user) {
        return null;
      }

      return this.mapUser(user);
    } catch (error) {
      this.logger.error('Error finding user by email:', error);
      return null;
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
      // Convert camelCase to snake_case
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };
      
      if (updateUserDto.email !== undefined) updateData.email = updateUserDto.email;
      if (updateUserDto.name !== undefined) updateData.name = updateUserDto.name;
      if (updateUserDto.roles !== undefined) updateData.roles = updateUserDto.roles;
      if (updateUserDto.isActive !== undefined) updateData.is_active = updateUserDto.isActive;
      if (updateUserDto.avatar !== undefined) updateData.avatar = updateUserDto.avatar;

      // Handle password update separately if provided
      if (updateUserDto.password) {
        const passwordValidation = this.validationService.validatePassword(
          updateUserDto.password
        );
        if (!passwordValidation.isValid) {
          throw new BadRequestException(passwordValidation.message);
        }
        updateData.password = await bcrypt.hash(updateUserDto.password, 12);
      }

      const { data: user, error } = await this.supabase.client
        .from('users')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          requested_tickets:tickets!requester_id (id, status),
          assigned_tickets:tickets!assigned_to_id (id, status)
        `)
        .single();

      if (error) {
        this.logger.error('Error updating user:', error);
        throw error;
      }

      this.logger.log(`User updated: ${user.email}`);
      return this.mapUser(user);
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
      const { data: user, error } = await this.supabase.client
        .from('users')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select(`
          *,
          requested_tickets:tickets!requester_id (id, status),
          assigned_tickets:tickets!assigned_to_id (id, status)
        `)
        .single();

      if (error) {
        this.logger.error('Error deactivating user:', error);
        throw error;
      }

      this.logger.log(`User deactivated: ${user.email}`);
      return this.mapUser(user);
    } catch (error) {
      this.logger.error('Error deactivating user:', error);
      throw error;
    }
  }

  async getUsersByRole(
    role: string | UserRole
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
      const roleStr = typeof role === 'string' ? role : role;
      
      const { data: users, error } = await this.supabase.client
        .from('users')
        .select(`
          *,
          requested_tickets:tickets!requester_id (id, status),
          assigned_tickets:tickets!assigned_to_id (id, status)
        `)
        .contains('roles', [roleStr])
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        this.logger.error('Error getting users by role:', error);
        throw error;
      }

      return (users || []).map(this.mapUser);
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
      const { data: users, error } = await this.supabase.client
        .from('users')
        .select(`
          *,
          assigned_tickets:tickets!assigned_to_id (id, status)
        `)
        .contains('roles', ['SUPPORT_STAFF'])
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        this.logger.error('Error getting support staff:', error);
        throw error;
      }

      return (users || [])
        .map(user => {
          // Filter tickets by status
          const openTickets = (user.assigned_tickets || []).filter(
            (ticket: any) => ['NEW', 'OPEN', 'IN_PROGRESS', 'REOPENED'].includes(ticket.status)
          );

          return {
            ...this.mapUser(user),
            openTicketCount: openTickets.length,
          };
        })
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
      const { data: users, error } = await this.supabase.client
        .from('users')
        .select(`
          *,
          assigned_tickets:tickets!assigned_to_id (id, status)
        `)
        .contains('roles', ['SUPPORT_MANAGER'])
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        this.logger.error('Error getting support managers:', error);
        throw error;
      }

      return (users || [])
        .map(user => {
          // Filter tickets by status
          const openTickets = (user.assigned_tickets || []).filter(
            (ticket: any) => ['NEW', 'OPEN', 'IN_PROGRESS', 'REOPENED'].includes(ticket.status)
          );

          return {
            ...this.mapUser(user),
            openTicketCount: openTickets.length,
          };
        })
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
    return this.getUsersByRole('ADMIN');
  }

  /**
   * Map Supabase snake_case to camelCase for API compatibility
   */
  private mapUser(user: any): any {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles || [],
      isActive: user.is_active ?? true,
      avatar: user.avatar,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      requestedTickets: user.requested_tickets || [],
      assignedTickets: user.assigned_tickets || [],
    };
  }
}
