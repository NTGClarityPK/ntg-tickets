import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { SystemConfigService } from '../../../common/config/system-config.service';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
    private systemConfigService: SystemConfigService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: {
    sub: string;
    email: string;
    roles: string[];
    activeRole: string;
    iat: number;
    exp: number;
  }) {
    try {
      // Debug logging removed for production

      // Use the user ID from the JWT payload instead of email
      const user = await this.authService.getCurrentUser(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found or inactive');
      }

      // Debug logging removed for production

      // Add activeRole to the user object for easy access
      return {
        ...user,
        activeRole: payload.activeRole,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
