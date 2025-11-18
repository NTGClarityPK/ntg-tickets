# Migration Guide: Using @ntg/shared-library

This guide documents the migration from local shared code to the `@ntg/shared-library` package.

## Overview

The shared library has been extracted and is now available as `@ntg/shared-library`. This guide shows how to update your imports.

## Frontend Migration

### Hooks

**Before:**
```typescript
import { useTheme } from '../../hooks/useTheme';
import { useDebounce } from '../../hooks/useDebounce';
import { useRTL } from '../../hooks/useRTL';
import { useKeyboardNavigation } from '../../hooks/useKeyboardNavigation';
import { useDynamicTheme } from '../../hooks/useDynamicTheme';
```

**After:**
```typescript
import { 
  useTheme, 
  useDebounce, 
  useRTL, 
  useKeyboardNavigation,
  useDynamicTheme 
} from '@ntg/shared-library';
```

### Components

**Before:**
```typescript
import { ThemeToggle } from '../theme/ThemeToggle';
import { DynamicThemeProvider } from '../providers/DynamicThemeProvider';
import { LanguageSwitcher } from '../language/LanguageSwitcher';
import { LanguageDetector } from '../language/LanguageDetector';
import { RTLProvider } from '../providers/RTLProvider';
import { ErrorBoundary } from '../error/ErrorBoundary';
import { RTLChevronDown } from '../ui/RTLIcon';
```

**After:**
```typescript
import {
  ThemeToggle,
  DynamicThemeProvider,
  LanguageSwitcher,
  LanguageDetector,
  RTLProvider,
  ErrorBoundary,
  RTLChevronDown,
} from '@ntg/shared-library';
```

### Utilities

**Before:**
```typescript
import { formatDate, formatRelativeTime } from '../lib/utils/date.utils';
import { STORAGE_KEYS, TIMING_CONFIG } from '../lib/constants';
import { generateColorPalette } from '../lib/colorConfig';
```

**After:**
```typescript
import { 
  formatDate, 
  formatRelativeTime,
  STORAGE_KEYS,
  TIMING_CONFIG,
  generateColorPalette 
} from '@ntg/shared-library';
```

## Backend Migration

### Guards

**Before:**
```typescript
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RateLimitGuard } from '../common/guards/rate-limit.guard';
import { CsrfGuard } from '../common/guards/csrf.guard';
```

**After:**
```typescript
import { 
  JwtAuthGuard, 
  RolesGuard, 
  RateLimitGuard,
  CsrfGuard 
} from '@ntg/shared-library/backend';
```

### Decorators

**Before:**
```typescript
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
```

**After:**
```typescript
import { Roles, CurrentUser } from '@ntg/shared-library/backend';
```

### Services

**Before:**
```typescript
import { SanitizationService } from '../common/validation/sanitization.service';
import { LoggerService } from '../common/logger/logger.service';
import { CacheService } from '../common/cache/cache.service';
import { RedisService } from '../common/redis/redis.service';
```

**After:**
```typescript
import { 
  SanitizationService,
  LoggerService,
  CacheService,
  RedisService 
} from '@ntg/shared-library/backend';
```

### Modules

**Before:**
```typescript
import { LoggerModule } from '../common/logger/logger.module';
import { CacheModule } from '../common/cache/cache.module';
import { RedisModule } from '../common/redis/redis.module';
```

**After:**
```typescript
import { 
  LoggerModule, 
  CacheModule, 
  RedisModule 
} from '@ntg/shared-library/backend';
```

### Middleware

**Before:**
```typescript
import { LoggingMiddleware } from '../common/middleware/logging.middleware';
import { SecurityHeadersMiddleware } from '../common/security/security-headers.service';
```

**After:**
```typescript
import { 
  LoggingMiddleware, 
  SecurityHeadersMiddleware 
} from '@ntg/shared-library/backend';
```

## Files That Can Be Removed

After migration, these files can be safely deleted (they're now in the library):

### Frontend
- `apps/frontend/src/hooks/useTheme.ts`
- `apps/frontend/src/hooks/useDebounce.ts`
- `apps/frontend/src/hooks/useRTL.ts`
- `apps/frontend/src/hooks/useKeyboardNavigation.ts`
- `apps/frontend/src/hooks/useDynamicTheme.ts`
- `apps/frontend/src/components/theme/ThemeToggle.tsx`
- `apps/frontend/src/components/providers/DynamicThemeProvider.tsx`
- `apps/frontend/src/components/language/LanguageSwitcher.tsx`
- `apps/frontend/src/components/language/LanguageDetector.tsx`
- `apps/frontend/src/components/providers/RTLProvider.tsx`
- `apps/frontend/src/components/error/ErrorBoundary.tsx`
- `apps/frontend/src/components/ui/RTLIcon.tsx`
- `apps/frontend/src/lib/utils/date.utils.ts`
- `apps/frontend/src/lib/colorConfig.ts`
- `apps/frontend/src/lib/constants.ts` (keep ticket-specific constants, remove generic ones)

### Backend
- `apps/backend/src/common/guards/jwt-auth.guard.ts` (if using generic version)
- `apps/backend/src/common/guards/roles.guard.ts`
- `apps/backend/src/common/guards/rate-limit.guard.ts`
- `apps/backend/src/common/guards/csrf.guard.ts`
- `apps/backend/src/common/decorators/roles.decorator.ts`
- `apps/backend/src/common/decorators/current-user.decorator.ts`
- `apps/backend/src/common/validation/sanitization.service.ts`
- `apps/backend/src/common/logger/logger.service.ts`
- `apps/backend/src/common/logger/logger.module.ts`
- `apps/backend/src/common/cache/cache.service.ts`
- `apps/backend/src/common/cache/cache.module.ts`
- `apps/backend/src/common/redis/redis.service.ts`
- `apps/backend/src/common/redis/redis.module.ts`
- `apps/backend/src/common/middleware/logging.middleware.ts`
- `apps/backend/src/common/security/security-headers.service.ts`

**Note:** Some files may have been converted to re-exports. Check if they only contain re-exports before deleting.

## Verification Steps

1. **Build the library:**
   ```bash
   cd project/apps/backend/project/ntg-shared-library
   npm run build
   ```

2. **Build frontend:**
   ```bash
   cd project/apps/frontend
   npm run build
   ```

3. **Build backend:**
   ```bash
   cd project/apps/backend
   npm run build
   ```

4. **Test Docker compose:**
   ```bash
   cd project
   docker compose --env-file ./.env.prod build
   docker compose --env-file ./.env.prod up -d
   ```

## Troubleshooting

### Import Errors

If you see import errors:
1. Ensure the library is installed: `npm install @ntg/shared-library`
2. Rebuild the library: `cd ntg-shared-library && npm run build`
3. Clear node_modules and reinstall: `rm -rf node_modules && npm install`

### Type Errors

If TypeScript can't find types:
1. Ensure the library is built
2. Check that `dist/index.d.ts` exists
3. Restart your TypeScript server

### Module Not Found

If modules aren't found:
1. Verify the library path in package.json is correct
2. Check that the library is properly linked/installed
3. Ensure exports in package.json match the file structure

## Next Steps

After migration:
1. Test all functionality
2. Remove old files (backup first!)
3. Update any remaining imports
4. Run full test suite
5. Verify Docker compose works

