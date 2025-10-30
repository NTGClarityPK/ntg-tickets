import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { SystemConfigService } from '../config/system-config.service';

export function IsValidPassword(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidPassword',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          if (typeof value !== 'string') {
            return false;
          }

          // Get system config service from the application context
          const systemConfigService = args.object[
            'systemConfigService'
          ] as SystemConfigService;
          if (!systemConfigService) {
            // Fallback to default validation if service not available
            return value.length >= 8;
          }

          const minLength = systemConfigService.getPasswordMinLength();
          return value.length >= minLength;
        },
        defaultMessage(args: ValidationArguments) {
          const systemConfigService = args.object[
            'systemConfigService'
          ] as SystemConfigService;
          const minLength = systemConfigService?.getPasswordMinLength() || 8;
          return `Password must be at least ${minLength} characters long`;
        },
      },
    });
  };
}
