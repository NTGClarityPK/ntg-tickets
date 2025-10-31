import {
  Injectable,
  UnauthorizedException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';
import { SystemConfigService } from '../../common/config/system-config.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

export interface SignUpDto {
  email: string;
  password: string;
  name: string;
  roles?: string[];
}

export interface SignInDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    roles: string[];
    isActive: boolean;
  };
}

@Injectable()
export class SupabaseAuthService {
  private readonly logger = new Logger(SupabaseAuthService.name);

  constructor(
    private supabase: SupabaseService,
    private systemConfigService: SystemConfigService,
    private auditLogsService: AuditLogsService
  ) {}

  /**
   * Sign up a new user
   * Creates user in Supabase Auth and syncs to public.users table
   */
  async signUp(signUpDto: SignUpDto): Promise<AuthResponse> {
    try {
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await this.supabase.auth.signUp({
        email: signUpDto.email,
        password: signUpDto.password,
        options: {
          data: {
            name: signUpDto.name,
            roles: signUpDto.roles || ['END_USER'],
          },
        },
      });

      if (authError || !authData.user) {
        this.logger.error('Error signing up user:', authError);
        throw new BadRequestException(authError?.message || 'Failed to create user');
      }

      // Create user record in public.users table
      const { data: userData, error: userError } = await this.supabase.client
        .from('users')
        .insert({
          id: authData.user.id,
          email: signUpDto.email,
          name: signUpDto.name,
          roles: signUpDto.roles || ['END_USER'],
          is_active: true,
          password: null, // Passwords are handled by Supabase Auth
        })
        .select()
        .single();

      if (userError) {
        this.logger.error('Error creating user record:', userError);
        // Try to delete auth user if database insert fails
        await this.supabase.auth.admin.deleteUser(authData.user.id);
        throw new BadRequestException('Failed to create user record');
      }

      // Generate tokens
      const tokens = await this.generateTokens(authData.user.id, signUpDto.email, signUpDto.name, signUpDto.roles || ['END_USER']);

      // Log audit
      await this.auditLogsService.createAuditLog({
        action: 'CREATE',
        resource: 'user',
        resourceId: authData.user.id,
        userId: authData.user.id,
        metadata: {
          email: signUpDto.email,
          roles: signUpDto.roles || ['END_USER'],
        },
      });

      return {
        ...tokens,
        user: {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          roles: userData.roles,
          isActive: userData.is_active,
        },
      };
    } catch (error) {
      this.logger.error('Sign up error:', error);
      throw error;
    }
  }

  /**
   * Sign in a user
   */
  async signIn(signInDto: SignInDto, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
    try {
      // Sign in with Supabase Auth
      const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
        email: signInDto.email,
        password: signInDto.password,
      });

      if (authError || !authData.user || !authData.session) {
        this.logger.warn(`Failed login attempt for ${signInDto.email}`);
        throw new UnauthorizedException('Invalid credentials');
      }

      // Get user from public.users table
      const { data: userData, error: userError } = await this.supabase.client
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .eq('is_active', true)
        .single();

      if (userError || !userData) {
        this.logger.error('User not found or inactive:', userError);
        throw new UnauthorizedException('User account not found or inactive');
      }

      // Use Supabase session tokens or generate your own JWT
      // For now, we'll use Supabase's access token
      const tokens = await this.generateTokens(
        userData.id,
        userData.email,
        userData.name,
        userData.roles,
        userData.roles[0] // activeRole
      );

      // Log the login action
      await this.auditLogsService.createAuditLog({
        action: 'LOGIN',
        resource: 'user',
        resourceId: userData.id,
        userId: userData.id,
        ipAddress,
        userAgent,
        metadata: {
          userRoles: userData.roles,
          loginTime: new Date().toISOString(),
        },
      });

      return {
        accessToken: authData.session.access_token, // Use Supabase token
        refreshToken: authData.session.refresh_token,
        user: {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          roles: userData.roles,
          isActive: userData.is_active,
        },
      };
    } catch (error) {
      this.logger.error('Sign in error:', error);
      throw error;
    }
  }

  /**
   * Sign out a user
   */
  async signOut(userId: string, accessToken?: string): Promise<void> {
    try {
      // If you have the session token, use Supabase's signOut
      if (accessToken) {
        // Create a client with the user's token
        const userClient = this.supabase.getClient();
        await userClient.auth.signOut();
      }

      // Log the logout action
      await this.auditLogsService.createAuditLog({
        action: 'LOGOUT',
        resource: 'user',
        resourceId: userId,
        userId,
        metadata: {
          logoutTime: new Date().toISOString(),
        },
      });
    } catch (error) {
      this.logger.error('Sign out error:', error);
      // Don't throw - logout should always succeed
    }
  }

  /**
   * Get current user by token
   */
  async getUserFromToken(token: string) {
    try {
      // Verify token with Supabase
      const { data: { user }, error } = await this.supabase.auth.getUser(token);

      if (error || !user) {
        return null;
      }

      // Get user from public.users table
      const { data: userData, error: userError } = await this.supabase.client
        .from('users')
        .select('*')
        .eq('id', user.id)
        .eq('is_active', true)
        .single();

      if (userError || !userData) {
        return null;
      }

      return {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        roles: userData.roles,
        isActive: userData.is_active,
      };
    } catch (error) {
      this.logger.error('Get user from token error:', error);
      return null;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string) {
    try {
      const { data, error } = await this.supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (error || !data.session) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
      };
    } catch (error) {
      this.logger.error('Refresh token error:', error);
      throw error;
    }
  }

  /**
   * Update user password (using Supabase Auth)
   */
  async updatePassword(userId: string, newPassword: string) {
    try {
      // Supabase Auth handles password updates
      const { data, error } = await this.supabase.auth.admin.updateUserById(userId, {
        password: newPassword,
      });

      if (error) {
        throw new BadRequestException(error.message);
      }

      return { success: true };
    } catch (error) {
      this.logger.error('Update password error:', error);
      throw error;
    }
  }

  /**
   * Generate JWT tokens (if you want to use your own JWT instead of Supabase tokens)
   * This is optional - you can use Supabase's built-in tokens
   */
  private async generateTokens(
    userId: string,
    email: string,
    name: string,
    roles: string[],
    activeRole?: string
  ) {
    // Option 1: Use Supabase's built-in tokens (recommended)
    // Return the tokens from the session

    // Option 2: Generate your own JWT tokens
    // You can still use @nestjs/jwt if you want custom tokens
    // This requires maintaining your own token system

    // For now, this method is a placeholder
    // In practice, you'd use the tokens from Supabase Auth session
    
    return {
      accessToken: '', // Will be set from Supabase session
      refreshToken: '', // Will be set from Supabase session
    };
  }

  /**
   * Validate user by email (for compatibility with existing code)
   */
  async validateUser(email: string) {
    try {
      const { data: userData, error } = await this.supabase.client
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (error || !userData) {
        return null;
      }

      return {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        roles: userData.roles,
        isActive: userData.is_active,
      };
    } catch (error) {
      this.logger.error('Error validating user:', error);
      return null;
    }
  }
}

