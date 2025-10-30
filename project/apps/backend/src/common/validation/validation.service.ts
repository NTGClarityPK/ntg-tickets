import { Injectable } from '@nestjs/common';
import { SystemConfigService } from '../config/system-config.service';

@Injectable()
export class ValidationService {
  constructor(private systemConfigService: SystemConfigService) {}

  validatePassword(password: string): { isValid: boolean; message?: string } {
    const minLength = this.systemConfigService.getPasswordMinLength();

    if (password.length < minLength) {
      return {
        isValid: false,
        message: `Password must be at least ${minLength} characters long`,
      };
    }

    // Add more password validation rules as needed
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUpperCase) {
      return {
        isValid: false,
        message: 'Password must contain at least one uppercase letter',
      };
    }

    if (!hasLowerCase) {
      return {
        isValid: false,
        message: 'Password must contain at least one lowercase letter',
      };
    }

    if (!hasNumbers) {
      return {
        isValid: false,
        message: 'Password must contain at least one number',
      };
    }

    if (!hasSpecialChar) {
      return {
        isValid: false,
        message: 'Password must contain at least one special character',
      };
    }

    return { isValid: true };
  }

  validateLoginAttempts(attempts: number): boolean {
    const maxAttempts = this.systemConfigService.getMaxLoginAttempts();
    return attempts < maxAttempts;
  }

  getPasswordRequirements(): string[] {
    const minLength = this.systemConfigService.getPasswordMinLength();
    return [
      `At least ${minLength} characters long`,
      'At least one uppercase letter',
      'At least one lowercase letter',
      'At least one number',
      'At least one special character',
    ];
  }
}
