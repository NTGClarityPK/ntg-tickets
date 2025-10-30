import { useSystemSettings } from './useSystemSettings';
import { useTranslations } from 'next-intl';
import { VALIDATION_RULES } from '../lib/constants';

export function usePasswordValidation() {
  const { data: settings } = useSystemSettings();
  const t = useTranslations('auth');

  const validatePassword = (password: string): string | null => {
    const minLength =
      settings?.passwordMinLength || VALIDATION_RULES.PASSWORD.MIN_LENGTH;

    if (password.length < minLength) {
      return t('passwordMinLength', { minLength });
    }

    if (
      VALIDATION_RULES.PASSWORD.REQUIRE_UPPERCASE &&
      !/[A-Z]/.test(password)
    ) {
      return t('passwordUppercase');
    }

    if (
      VALIDATION_RULES.PASSWORD.REQUIRE_LOWERCASE &&
      !/[a-z]/.test(password)
    ) {
      return t('passwordLowercase');
    }

    if (VALIDATION_RULES.PASSWORD.REQUIRE_NUMBER && !/\d/.test(password)) {
      return t('passwordNumber');
    }

    if (
      VALIDATION_RULES.PASSWORD.REQUIRE_SPECIAL &&
      !VALIDATION_RULES.PASSWORD.SPECIAL_CHARS.test(password)
    ) {
      return t('passwordSpecial');
    }

    return null;
  };

  const getPasswordRequirements = (): string[] => {
    const minLength =
      settings?.passwordMinLength || VALIDATION_RULES.PASSWORD.MIN_LENGTH;
    const requirements = [t('passwordMinLength', { minLength })];

    if (VALIDATION_RULES.PASSWORD.REQUIRE_UPPERCASE) {
      requirements.push(t('passwordUppercase'));
    }
    if (VALIDATION_RULES.PASSWORD.REQUIRE_LOWERCASE) {
      requirements.push(t('passwordLowercase'));
    }
    if (VALIDATION_RULES.PASSWORD.REQUIRE_NUMBER) {
      requirements.push(t('passwordNumber'));
    }
    if (VALIDATION_RULES.PASSWORD.REQUIRE_SPECIAL) {
      requirements.push(t('passwordSpecial'));
    }

    return requirements;
  };

  return {
    validatePassword,
    getPasswordRequirements,
    minLength:
      settings?.passwordMinLength || VALIDATION_RULES.PASSWORD.MIN_LENGTH,
  };
}
