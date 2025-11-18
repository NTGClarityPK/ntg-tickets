/**
 * Frontend exports for @ntg/shared-library
 * 
 * This file exports all frontend components, hooks, utilities, and providers
 * that can be used in React/Next.js applications.
 */

// Hooks
export { useDebounce } from './hooks/useDebounce';
export { useTheme } from './hooks/useTheme';
export type { Theme } from './hooks/useTheme';
export { useRTL } from './hooks/useRTL';
export { useKeyboardNavigation } from './hooks/useKeyboardNavigation';
export type { KeyboardShortcut } from './hooks/useKeyboardNavigation';
export { useDynamicTheme } from './hooks/useDynamicTheme';
export type { DynamicThemeConfig } from './hooks/useDynamicTheme';

// Components - Theme
export { ThemeToggle } from './components/theme/ThemeToggle';
export { DynamicThemeProvider, type DynamicThemeProviderProps } from './components/providers/DynamicThemeProvider';

// Components - Language/i18n
export { LanguageSwitcher, type Language, type LanguageSwitcherProps } from './components/language/LanguageSwitcher';
export { LanguageDetector, type LanguageDetectorProps } from './components/language/LanguageDetector';
export { RTLProvider, type RTLProviderProps } from './components/providers/RTLProvider';

// Components - UI
export {
  RTLIcon,
  RTLArrowRight,
  RTLArrowLeft,
  RTLChevronRight,
  RTLChevronLeft,
  RTLChevronDown,
  type RTLIconProps,
} from './components/ui/RTLIcon';

// Components - Error
export {
  ErrorBoundary,
  useErrorHandler,
  withErrorBoundary,
  type ErrorBoundaryProps,
} from './components/error/ErrorBoundary';

// Constants
export * from './lib/constants';

// Color Configuration
export * from './lib/colorConfig';

// Utilities
export * from './utils/date.utils';

// Types are already exported above

