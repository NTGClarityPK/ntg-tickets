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
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { SanitizationService } from '../../common/validation/sanitization.service';
import { TokenBlacklistService } from '../../common/security/token-blacklist.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly supabaseAuthService: SupabaseAuthService,
    private readonly sanitizationService: SanitizationService,
    private readonly tokenBlacklistService: TokenBlacklistService
  ) {}

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
    @Body() body: { activeRole: string }
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
      const ipAddress =
        req.ip ||
        req.connection?.remoteAddress ||
        req.headers['x-forwarded-for'];
      const userAgent = req.headers['user-agent'];

      const result = await this.authService.switchActiveRole(
        req.user.id,
        body.activeRole,
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
      if (error instanceof BadRequestException) {
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

      return {
        data: {
          user: {
            id: result.user.id,
            email: result.user.email,
            name: result.user.name,
            roles: result.user.roles,
            activeRole,
          },
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
