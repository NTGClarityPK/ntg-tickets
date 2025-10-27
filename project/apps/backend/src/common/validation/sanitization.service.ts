import { Injectable } from '@nestjs/common';
import * as validator from 'validator';

@Injectable()
export class SanitizationService {
  sanitizeEmail(email: string): string {
    if (!email || typeof email !== 'string') {
      throw new Error('Invalid email input');
    }

    const sanitized = validator.normalizeEmail(email.trim().toLowerCase());
    if (!sanitized || !validator.isEmail(sanitized)) {
      throw new Error('Invalid email format');
    }

    return sanitized;
  }

  sanitizeString(input: string, maxLength: number = 255): string {
    if (!input || typeof input !== 'string') {
      throw new Error('Invalid string input');
    }

    const sanitized = validator.escape(input.trim());
    if (sanitized.length > maxLength) {
      throw new Error(
        `Input exceeds maximum length of ${maxLength} characters`
      );
    }

    return sanitized;
  }

  sanitizePassword(password: string): string {
    if (!password || typeof password !== 'string') {
      throw new Error('Invalid password input');
    }

    // Remove any potential XSS attempts but preserve special characters needed for passwords
    const sanitized = password.replace(
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      ''
    );

    if (sanitized.length < 6) {
      throw new Error('Password too short');
    }

    if (sanitized.length > 128) {
      throw new Error('Password too long');
    }

    return sanitized;
  }

  sanitizeRole(role: string): string {
    if (!role || typeof role !== 'string') {
      throw new Error('Invalid role input');
    }

    const validRoles = [
      'END_USER',
      'SUPPORT_STAFF',
      'SUPPORT_MANAGER',
      'ADMIN',
    ];
    const sanitized = role.trim().toUpperCase();

    if (!validRoles.includes(sanitized)) {
      throw new Error('Invalid role');
    }

    return sanitized;
  }

  sanitizeId(id: string): string {
    if (!id || typeof id !== 'string') {
      throw new Error('Invalid ID input');
    }

    const sanitized = validator.escape(id.trim());
    if (!validator.isUUID(sanitized)) {
      throw new Error('Invalid ID format');
    }

    return sanitized;
  }
}
