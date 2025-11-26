import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class TokenBlacklistService {
  private readonly logger = new Logger(TokenBlacklistService.name);

  constructor(
    private readonly redis: RedisService
  ) {}

  /**
   * Decode JWT token without verification (just to get expiration)
   * Supabase tokens are JWTs, so we can decode the payload
   */
  private decodeToken(token: string): { exp?: number } | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      return payload;
    } catch (error) {
      this.logger.warn('Error decoding token:', error);
      return null;
    }
  }

  async blacklistToken(token: string): Promise<void> {
    try {
      // Decode token to get expiration time
      const decoded = this.decodeToken(token);
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
