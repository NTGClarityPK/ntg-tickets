import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../auth.service';
import { TokenBlacklistService } from '../../../common/security/token-blacklist.service';

@Injectable()
export class NextAuthJwtGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private tokenBlacklistService: TokenBlacklistService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      // Check if token is blacklisted
      const isBlacklisted =
        await this.tokenBlacklistService.isTokenBlacklisted(token);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }

      const user = await this.authService.validateJwtToken(token);
      if (!user) {
        throw new UnauthorizedException('Invalid token');
      }

      request.user = user;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromHeader(request: {
    headers: { authorization?: string };
  }): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
