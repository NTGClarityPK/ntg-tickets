import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SupabaseAuthService } from './supabase-auth.service';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { SignupDto } from './dto/signup.dto';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { SanitizationService } from '../../common/validation/sanitization.service';
import { TokenBlacklistService } from '../../common/security/token-blacklist.service';
import { PrismaService } from '../../database/prisma.service';
import { UserRole } from '@prisma/client';
import { TenantsService } from '../tenants/tenants.service';
import { EmailTemplatesService } from '../email-templates/email-templates.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly supabaseAuthService: SupabaseAuthService,
    private readonly sanitizationService: SanitizationService,
    private readonly tokenBlacklistService: TokenBlacklistService,
    private readonly prisma: PrismaService,
    private readonly tenantsService: TenantsService,
    private readonly emailTemplatesService: EmailTemplatesService,
  ) {}

  // ===== ORGANIZATION SIGNUP =====

  @Post('signup')
  @UseGuards(RateLimitGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new organization with admin user' })
  @ApiResponse({ status: 201, description: 'Organization created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or organization already exists' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async signup(@Body() signupDto: SignupDto): Promise<{
    data: {
      organization: { id: string; name: string; slug: string };
      user: { id: string; email: string; name: string; roles: string[] };
      access_token: string;
      refresh_token: string;
    };
    message: string;
  }> {
    try {
      const email = this.sanitizationService.sanitizeEmail(signupDto.adminEmail);
      const password = this.sanitizationService.sanitizePassword(signupDto.password);
      const name = this.sanitizationService.sanitizeString(signupDto.adminName);
      const orgName = this.sanitizationService.sanitizeString(signupDto.organizationName);

      // Generate slug if not provided
      const slug = signupDto.organizationSlug || this.generateSlug(orgName);

      // Check if organization slug already exists
      const existingTenant = await this.prisma.tenant.findUnique({
        where: { slug },
      });

      if (existingTenant) {
        throw new BadRequestException('An organization with this name already exists');
      }

      // Check if email already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new BadRequestException('An account with this email already exists');
      }

      // Create the organization
      const tenant = await this.prisma.tenant.create({
        data: {
          name: orgName,
          slug,
          plan: 'FREE',
          maxUsers: 10,
          isActive: true,
        },
      });

      // Create user in Supabase Auth
      const supabase = this.supabaseAuthService.getAdminClient();
      const {
        data: { user: supabaseUser },
        error: authError,
      } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          name,
          roles: ['ADMIN'],
          tenantId: tenant.id,
        },
      });

      if (authError || !supabaseUser) {
        // Rollback tenant creation
        await this.prisma.tenant.delete({ where: { id: tenant.id } });
        this.logger.error('Error creating Supabase user:', authError);
        throw new BadRequestException(authError?.message || 'Failed to create user account');
      }

      // Create user in database
      try {
        const user = await this.prisma.user.create({
          data: {
            id: supabaseUser.id,
            tenantId: tenant.id,
            email,
            name,
            roles: [UserRole.ADMIN],
            isActive: true,
          },
        });

        // Sign in the user to get tokens
        const signInResult = await this.supabaseAuthService.signIn(email, password);

        // Create default categories AND subcategories for the new organization
        await this.tenantsService.initializeDefaultCategories(tenant.id, user.id);

        // Create default workflow for the new organization
        await this.createDefaultWorkflow(tenant.id, user.id);

        // Create default system settings
        await this.createDefaultSettings(tenant.id);

        // Create default email templates for the new organization
        await this.emailTemplatesService.createDefaultTemplates(tenant.id);

        return {
          data: {
            organization: {
              id: tenant.id,
              name: tenant.name,
              slug: tenant.slug,
            },
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              roles: user.roles.map(r => r.toString()),
            },
            access_token: signInResult.access_token,
            refresh_token: signInResult.refresh_token,
          },
          message: 'Organization created successfully',
        };
      } catch (error) {
        // Rollback: delete Supabase user and tenant
        await supabase.auth.admin.deleteUser(supabaseUser.id);
        await this.prisma.tenant.delete({ where: { id: tenant.id } });
        throw error;
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Error during signup:', error);
      throw new BadRequestException('Failed to create organization');
    }
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  // Removed createDefaultCategories - now using TenantsService.initializeDefaultCategories
  // which creates both categories AND subcategories

  private async createDefaultWorkflow(tenantId: string, userId: string) {
    const defaultDefinition = {
      nodes: [
        { id: 'create', type: 'statusNode', position: { x: 50, y: 80 }, data: { label: 'Create Ticket', color: '#4caf50', isInitial: true } },
        { id: 'new', type: 'statusNode', position: { x: 280, y: 80 }, data: { label: 'New', color: '#ff9800' } },
        { id: 'open', type: 'statusNode', position: { x: 510, y: 80 }, data: { label: 'Open', color: '#2196f3' } },
        { id: 'in_progress', type: 'statusNode', position: { x: 510, y: 200 }, data: { label: 'In Progress', color: '#ff9800' } },
        { id: 'resolved', type: 'statusNode', position: { x: 740, y: 80 }, data: { label: 'Resolved', color: '#4caf50' } },
        { id: 'closed', type: 'statusNode', position: { x: 970, y: 80 }, data: { label: 'Closed', color: '#9e9e9e' } },
        { id: 'reopened', type: 'statusNode', position: { x: 1100, y: 280 }, data: { label: 'Reopened', color: '#f44336' } },
        { id: 'on_hold', type: 'statusNode', position: { x: 510, y: 320 }, data: { label: 'On Hold', color: '#9e9e9e' } },
      ],
      edges: [
        { id: 'e0-create', source: 'create', target: 'new', label: 'Create Ticket', type: 'smoothstep', markerEnd: { type: 'arrowclosed' }, data: { roles: ['END_USER'], conditions: [], actions: [], isCreateTransition: true } },
        { id: 'e1', source: 'new', target: 'open', label: 'Open', type: 'smoothstep', markerEnd: { type: 'arrowclosed' }, data: { roles: ['SUPPORT_STAFF', 'ADMIN'], conditions: [], actions: ['SEND_NOTIFICATION'] } },
        { id: 'e2', source: 'open', target: 'in_progress', label: 'Start Work', type: 'smoothstep', markerEnd: { type: 'arrowclosed' }, data: { roles: ['SUPPORT_STAFF', 'ADMIN'], conditions: [], actions: ['SEND_NOTIFICATION'] } },
        { id: 'e3', source: 'in_progress', target: 'resolved', label: 'Resolve', type: 'smoothstep', markerEnd: { type: 'arrowclosed' }, data: { roles: ['SUPPORT_STAFF', 'ADMIN'], conditions: [], actions: ['SEND_NOTIFICATION'] } },
        { id: 'e3-hold', source: 'in_progress', target: 'on_hold', label: 'Put On Hold', type: 'smoothstep', markerEnd: { type: 'arrowclosed' }, data: { roles: ['SUPPORT_STAFF', 'ADMIN'], conditions: [], actions: ['SEND_NOTIFICATION'] } },
        { id: 'e3-resume', source: 'on_hold', target: 'in_progress', label: 'Resume Work', type: 'smoothstep', markerEnd: { type: 'arrowclosed' }, data: { roles: ['SUPPORT_STAFF', 'ADMIN'], conditions: [], actions: ['SEND_NOTIFICATION'] } },
        { id: 'e4', source: 'resolved', target: 'closed', label: 'Close', type: 'smoothstep', markerEnd: { type: 'arrowclosed' }, data: { roles: ['SUPPORT_STAFF', 'ADMIN'], conditions: [], actions: ['SEND_NOTIFICATION'] } },
        { id: 'e5', source: 'closed', target: 'reopened', label: 'Reopen', type: 'smoothstep', markerEnd: { type: 'arrowclosed' }, data: { roles: ['END_USER', 'ADMIN'], conditions: [], actions: ['SEND_NOTIFICATION'] } },
        { id: 'e6', source: 'reopened', target: 'in_progress', label: 'Resume Work', type: 'smoothstep', markerEnd: { type: 'arrowclosed' }, data: { roles: ['SUPPORT_STAFF', 'ADMIN'], conditions: [], actions: ['SEND_NOTIFICATION'] } },
      ],
    };

    await this.prisma.workflow.create({
      data: {
        tenantId,
        name: 'Default Workflow',
        description: 'System default workflow for ticket management.',
        status: 'ACTIVE',
        isDefault: true,
        isSystemDefault: true,
        isActive: true,
        version: 1,
        definition: defaultDefinition as any,
        createdBy: userId,
        workingStatuses: ['NEW', 'OPEN', 'IN_PROGRESS', 'REOPENED'],
        doneStatuses: ['CLOSED', 'RESOLVED'],
      },
    });
  }

  private async createDefaultSettings(tenantId: string) {
    const settings = [
      { key: 'site_name', value: 'NTG Ticket' },
      { key: 'timezone', value: 'UTC' },
      { key: 'language', value: 'en' },
      { key: 'auto_assign_tickets', value: 'true' },
      { key: 'auto_close_resolved_tickets', value: 'true' },
      { key: 'auto_close_days', value: '5' },
      { key: 'max_file_size', value: '10485760' },
      { key: 'ticket_number_counter', value: '0' },
    ];

    for (const setting of settings) {
      await this.prisma.systemSettings.create({
        data: { tenantId, key: setting.key, value: setting.value },
      });
    }
  }

  @Post('login')
  @UseGuards(RateLimitGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user with Supabase Auth (Primary)' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async login(
    @Body() body: { email: string; password: string; activeRole?: string },
    @Request() req
  ): Promise<{
    data: {
      access_token: string;
      refresh_token: string;
      user: {
        id: string;
        email: string;
        name: string;
        roles: string[];
        activeRole: string;
      };
    };
    message: string;
  }> {
    try {
      // Use Supabase Auth (Option A: Full Supabase Auth)
      const email = this.sanitizationService.sanitizeEmail(body.email);
      const password = this.sanitizationService.sanitizePassword(body.password);

      const result = await this.supabaseAuthService.signIn(email, password);

      // Determine active role
      const activeRole = body.activeRole || result.user.roles[0] || 'END_USER';

      // If user has multiple roles and no activeRole specified, they need to select one
      if (result.user.roles.length > 1 && !body.activeRole) {
        return {
          data: {
            access_token: result.access_token,
            refresh_token: result.refresh_token,
            user: {
              id: result.user.id,
              email: result.user.email,
              name: result.user.name,
              roles: result.user.roles,
              activeRole: '',
            },
          },
          message: 'Role selection required',
        };
      }

      return {
        data: {
          access_token: result.access_token,
          refresh_token: result.refresh_token,
          user: {
            id: result.user.id,
            email: result.user.email,
            name: result.user.name,
            roles: result.user.roles,
            activeRole,
          },
        },
        message: 'Login successful',
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  @Post('refresh')
  @UseGuards(RateLimitGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh Supabase session token (Primary)' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async refreshToken(@Body() body: { refresh_token: string }): Promise<{
    data: {
      access_token: string;
      refresh_token: string;
    };
    message: string;
  }> {
    try {
      if (!body.refresh_token) {
        throw new UnauthorizedException('Refresh token is required');
      }

      // Use Supabase Auth refresh (Option A)
      const result = await this.supabaseAuthService.refreshSession(
        body.refresh_token
      );

      return {
        data: {
          access_token: result.access_token,
          refresh_token: result.refresh_token,
        },
        message: 'Token refreshed successfully',
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  @Post('logout')
  @UseGuards(SupabaseAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(@Request() req): Promise<{ message: string }> {
    try {
      // Extract token from Authorization header
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        await this.tokenBlacklistService.blacklistToken(token);
      }

      return {
        message: 'Logout successful',
      };
    } catch (error) {
      this.logger.error('Error during logout:', error);
      return {
        message: 'Logout successful',
      };
    }
  }

  @Get('me')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user information (Supabase Auth)' })
  @ApiResponse({
    status: 200,
    description: 'User information retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCurrentUser(
    @Request() req
  ): Promise<{
    data: {
      id: string;
      email: string;
      name: string;
      roles: string[];
      activeRole: string;
      isActive: boolean;
      organization?: {
        id: string;
        name: string;
        slug: string;
        domain?: string;
        plan: string;
        maxUsers: number;
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
      } | null;
    } | null;
    message: string;
  }> {
    const user = await this.authService.getCurrentUser(req.user.id);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return {
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles,
        activeRole: user.activeRole || user.roles[0] || 'END_USER',
        isActive: user.isActive,
        organization: user.organization || null,
      },
      message: 'User information retrieved successfully',
    };
  }

  @Post('users/:userId/role')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user role (Admin only)' })
  @ApiResponse({ status: 200, description: 'User role updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async updateUserRole(
    @Param('userId') userId: string,
    @Request() req,
    @Body() updateUserRoleDto: UpdateUserRoleDto
  ): Promise<{
    data: {
      id: string;
      email: string;
      name: string;
      roles: string[];
      isActive: boolean;
    };
    message: string;
  }> {
    // Check if user is admin
    if (req.user.activeRole !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }

    // Pass current user ID to prevent self-admin removal
    const user = await this.authService.updateUserRoles(
      userId,
      [updateUserRoleDto.role],
      req.user.id
    );

    return {
      data: user,
      message: 'User role updated successfully',
    };
  }

  @Post('switch-role')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Switch active role for multi-role user' })
  @ApiResponse({ status: 200, description: 'Role switched successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Invalid role' })
  async switchRole(
    @Request() req,
    @Body() body: { activeRole: string; refresh_token?: string }
  ): Promise<{
    data: {
      access_token: string;
      refresh_token: string;
      user: {
        id: string;
        email: string;
        name: string;
        roles: string[];
        activeRole: string;
      };
    };
    message: string;
  }> {
    try {
      if (!body.refresh_token) {
        this.logger.warn('Switch role called without refresh_token');
        throw new BadRequestException('Refresh token is required for role switching');
      }

      const ipAddress =
        req.ip ||
        req.connection?.remoteAddress ||
        req.headers['x-forwarded-for'];
      const userAgent = req.headers['user-agent'];

      this.logger.log(`Switching role for user ${req.user.id} to ${body.activeRole}`);
      const result = await this.authService.switchActiveRole(
        req.user.id,
        body.activeRole,
        body.refresh_token,
        ipAddress,
        userAgent
      );

      return {
        data: {
          access_token: result.access_token,
          refresh_token: result.refresh_token,
          user: result.user,
        },
        message: 'Role switched successfully',
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof UnauthorizedException) {
        throw error;
      }
      throw new BadRequestException('Invalid role');
    }
  }

  // ========== Supabase Auth Endpoints ==========

  @Post('supabase/signup')
  @UseGuards(RateLimitGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Sign up with Supabase Auth' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async supabaseSignUp(
    @Body()
    body: {
      email: string;
      password: string;
      name: string;
      roles?: string[];
    }
  ): Promise<{
    data: {
      user: {
        id: string;
        email: string;
        name: string;
        roles: string[];
      };
      access_token: string;
      refresh_token: string;
    };
    message: string;
  }> {
    try {
      const email = this.sanitizationService.sanitizeEmail(body.email);
      const password = this.sanitizationService.sanitizePassword(body.password);
      const name = this.sanitizationService.sanitizeString(body.name);

      const roles = (body.roles || ['END_USER']).map(
        (r) => r.toUpperCase() as any
      );

      const result = await this.supabaseAuthService.signUp(
        email,
        password,
        name,
        roles
      );

      // Sign in the newly created user to get session
      const signInResult = await this.supabaseAuthService.signIn(
        email,
        password
      );

      return {
        data: {
          user: {
            id: result.user.id,
            email: result.user.email,
            name: result.user.name,
            roles: result.user.roles,
          },
          access_token: signInResult.access_token,
          refresh_token: signInResult.refresh_token,
        },
        message: 'User created successfully',
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to create user');
    }
  }

  @Post('supabase/signin')
  @UseGuards(RateLimitGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in with Supabase Auth' })
  @ApiResponse({ status: 200, description: 'Sign in successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async supabaseSignIn(
    @Body() body: { email: string; password: string },
    @Request() req
  ): Promise<{
    data: {
      user: {
        id: string;
        email: string;
        name: string;
        roles: string[];
        activeRole: string;
      };
      organization?: {
        id: string;
        name: string;
        slug: string;
        domain?: string;
        plan: string;
        maxUsers: number;
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
      } | null;
      access_token: string;
      refresh_token: string;
    };
    message: string;
  }> {
    try {
      const email = this.sanitizationService.sanitizeEmail(body.email);
      const password = this.sanitizationService.sanitizePassword(body.password);

      const result = await this.supabaseAuthService.signIn(email, password);

      // Determine active role (use first role for now)
      const activeRole = result.user.roles[0] || 'END_USER';

      // Get organization/tenant data
      const organization = result.user.tenant ? {
        id: result.user.tenant.id,
        name: result.user.tenant.name,
        slug: result.user.tenant.slug,
        domain: result.user.tenant.domain,
        plan: result.user.tenant.plan,
        maxUsers: result.user.tenant.maxUsers,
        isActive: result.user.tenant.isActive,
        createdAt: result.user.tenant.createdAt.toISOString(),
        updatedAt: result.user.tenant.updatedAt.toISOString(),
      } : null;

      return {
        data: {
          user: {
            id: result.user.id,
            email: result.user.email,
            name: result.user.name,
            roles: result.user.roles,
            activeRole,
          },
          organization,
          access_token: result.access_token,
          refresh_token: result.refresh_token,
        },
        message: 'Sign in successful',
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  @Post('supabase/refresh')
  @UseGuards(RateLimitGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh Supabase session' })
  @ApiResponse({ status: 200, description: 'Session refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async supabaseRefresh(
    @Body() body: { refresh_token: string }
  ): Promise<{
    data: {
      access_token: string;
      refresh_token: string;
    };
    message: string;
  }> {
    try {
      if (!body.refresh_token) {
        throw new UnauthorizedException('Refresh token is required');
      }

      const result = await this.supabaseAuthService.refreshSession(
        body.refresh_token
      );

      return {
        data: {
          access_token: result.access_token,
          refresh_token: result.refresh_token,
        },
        message: 'Session refreshed successfully',
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  @Post('supabase/signout')
  @UseGuards(SupabaseAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sign out from Supabase' })
  @ApiResponse({ status: 200, description: 'Signed out successfully' })
  async supabaseSignOut(@Request() req): Promise<{ message: string }> {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        await this.supabaseAuthService.signOut(token);
      }

      return {
        message: 'Signed out successfully',
      };
    } catch (error) {
      this.logger.error('Error during sign out:', error);
      return {
        message: 'Signed out successfully',
      };
    }
  }

  @Post('supabase/reset-password')
  @UseGuards(RateLimitGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({
    status: 200,
    description: 'Password reset email sent',
  })
  async supabaseResetPassword(
    @Body() body: { email: string }
  ): Promise<{ message: string }> {
    try {
      const email = this.sanitizationService.sanitizeEmail(body.email);
      await this.supabaseAuthService.resetPassword(email);

      return {
        message: 'Password reset email sent',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to send password reset email');
    }
  }

  @Get('supabase/me')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user (Supabase)' })
  @ApiResponse({
    status: 200,
    description: 'User information retrieved successfully',
  })
  async supabaseGetCurrentUser(@Request() req): Promise<{
    data: {
      id: string;
      email: string;
      name: string;
      roles: string[];
      isActive: boolean;
    } | null;
    message: string;
  }> {
    const user = await this.authService.getCurrentUser(req.user.id);
    return {
      data: user,
      message: 'User information retrieved successfully',
    };
  }
}
