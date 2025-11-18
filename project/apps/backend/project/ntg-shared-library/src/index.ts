/**
 * Main entry point for @ntg/shared-library
 * 
 * This package provides shared components, utilities, and services
 * for both frontend (React/Next.js) and backend (NestJS) applications.
 * 
 * @example
 * // Frontend usage
 * import { useTheme, useDebounce } from '@ntg/shared-library';
 * 
 * // Backend usage
 * import { JwtAuthGuard, Roles } from '@ntg/shared-library/backend';
 */

// Frontend exports
export * from './frontend';

// Backend exports are available via '@ntg/shared-library/backend'
// This is to avoid conflicts and keep the API clean

