import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class TokenBlacklistService {
  private readonly logger = new Logger(TokenBlacklistService.name);

  constructor(
    private readonly redis: RedisService,
    private readonly jwtService: JwtService
  ) {}

  async blacklistToken(token: string): Promise<void> {
    try {
      // Decode token to get expiration time
      const decoded = this.jwtService.decode(token) as { exp?: number };
      if (decoded && decoded.exp) {
        const expirationTime = decoded.exp * 1000; // Convert to milliseconds
        const currentTime = Date.now();
        const ttl = Math.max(
          0,
          Math.floor((expirationTime - currentTime) / 1000)
        );

        if (ttl > 0) {
          await this.redis.setex(`blacklist:${token}`, ttl, 'true');
        }
      }
    } catch (error) {
      this.logger.error('Error blacklisting token:', error);
    }
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      const result = await this.redis.get(`blacklist:${token}`);
      return result === 'true';
    } catch (error) {
      this.logger.error('Error checking token blacklist:', error);
      return false;
    }
  }

  async blacklistUserTokens(userId: string): Promise<void> {
    try {
      // For now, we'll skip pattern-based token blacklisting
      // In a production system, you would maintain a list of active tokens per user
      this.logger.log(
        `User ${userId} tokens blacklisting requested - pattern matching not implemented`
      );
    } catch (error) {
      this.logger.error('Error blacklisting user tokens:', error);
    }
  }
}
