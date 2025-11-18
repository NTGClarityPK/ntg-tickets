import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { NextAuthJwtGuard } from './guards/nextauth-jwt.guard';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
// import { User } from '../users/entities/user.entity'; // Removed unused import
import { RateLimitGuard, SanitizationService } from '@ntg/shared-library/dist/backend';
import { TokenBlacklistService } from '../../common/security/token-blacklist.service';
// import { CsrfGuard } from '../../common/guards/csrf.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly sanitizationService: SanitizationService,
    private readonly tokenBlacklistService: TokenBlacklistService
  ) {}

  @Post('login')
  @UseGuards(RateLimitGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user and get JWT token' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async login(
    @Body() body: { email: string; password: string; activeRole?: string },
    @Request() req
  ): Promise<{
    data: {
      access_token: string;
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
      // Sanitize inputs
      const email = this.sanitizationService.sanitizeEmail(body.email);
      const password = this.sanitizationService.sanitizePassword(body.password);

      const user = await this.authService.validateUserCredentials(
        email,
        password
      );

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // If user has multiple roles and no activeRole specified, they need to select one
      if (user.roles.length > 1 && !body.activeRole) {
        return {
          data: {
            access_token: '',
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              roles: user.roles,
              activeRole: '',
            },
          },
          message: 'Role selection required',
        };
      }

      // Generate JWT token
      const ipAddress =
        req.ip ||
        req.connection?.remoteAddress ||
        req.headers['x-forwarded-for'];
      const userAgent = req.headers['user-agent'];

      const loginResult = await this.authService.login(
        {
          ...user,
          activeRole: body.activeRole,
        },
        ipAddress,
        userAgent
      );

      return {
        data: loginResult,
        message: 'Login successful',
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new BadRequestException('Invalid input data');
    }
  }

  @Post('refresh')
  @UseGuards(RateLimitGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh JWT token' })
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

      const result = await this.authService.refreshToken(body.refresh_token);

      if (!result) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return {
        data: result,
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
  @UseGuards(NextAuthJwtGuard)
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

  @Post('validate')
  @UseGuards(RateLimitGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate user credentials' })
  @ApiResponse({
    status: 200,
    description: 'Credentials validated successfully',
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async validateCredentials(
    @Body() body: { email: string; password: string }
  ): Promise<{
    data: {
      user: { id: string; email: string; name: string; roles: string[] };
    };
    message: string;
  }> {
    try {
      // Sanitize inputs
      const email = this.sanitizationService.sanitizeEmail(body.email);
      const password = this.sanitizationService.sanitizePassword(body.password);

      const user = await this.authService.validateUserCredentials(
        email,
        password
      );

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      return {
        data: { user },
        message: 'Credentials validated successfully',
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new BadRequestException('Invalid input data');
    }
  }

  @Get('me')
  @UseGuards(NextAuthJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user information' })
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

  @Post('users/:userId/role')
  @UseGuards(NextAuthJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user role (Admin only)' })
  @ApiResponse({ status: 200, description: 'User role updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async updateUserRole(
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
      throw new Error('Forbidden - Admin access required');
    }

    const user = await this.authService.updateUserRoles(req.params.userId, [
      updateUserRoleDto.role,
    ]);

    return {
      data: user,
      message: 'User role updated successfully',
    };
  }

  @Post('switch-role')
  @UseGuards(NextAuthJwtGuard)
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

  @Post('users/:userId/deactivate')
  @UseGuards(NextAuthJwtGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User deactivated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async deactivateUser(
    @Request() req
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
      throw new Error('Forbidden - Admin access required');
    }

    const user = await this.authService.deactivateUser(req.params.userId);

    return {
      data: user,
      message: 'User deactivated successfully',
    };
  }
}
