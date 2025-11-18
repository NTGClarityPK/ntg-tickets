# NTG Shared Library - Local Development Guide

This guide explains how to test, publish, and use the shared library locally and in production.

## Table of Contents

1. [Local Development Setup](#local-development-setup)
2. [Testing Locally](#testing-locally)
3. [Publishing the Library](#publishing-the-library)
4. [Using the Published Library](#using-the-published-library)
5. [Troubleshooting](#troubleshooting)

## Local Development Setup

### Prerequisites

- Node.js >= 18.0.0
- npm >= 8.0.0
- TypeScript >= 5.2.2

### Initial Setup

1. Navigate to the library directory:
```bash
cd project/ntg-shared-library
```

2. Install dependencies:
```bash
npm install
```

3. Build the library:
```bash
npm run build
```

This will compile TypeScript files and generate declaration files in the `dist` directory.

## Testing Locally

### Method 1: Using npm link (Recommended for Development)

This method allows you to test the library in your projects without publishing to npm.

#### Step 1: Link the library

In the `ntg-shared-library` directory:
```bash
npm link
```

This creates a global symlink to your library.

#### Step 2: Link in your project

In your frontend or backend project directory (e.g., `project/apps/frontend`):
```bash
npm link @ntg/shared-library
```

#### Step 3: Use the library

Import from the library in your code:
```typescript
// Frontend example
import { useTheme, ThemeToggle, DynamicThemeProvider } from '@ntg/shared-library';
import { JwtAuthGuard, RolesGuard } from '@ntg/shared-library/backend';

// Backend example
import { JwtAuthGuard, RolesGuard, LoggerService } from '@ntg/shared-library/backend';
```

#### Step 4: Rebuild when making changes

After making changes to the library:
```bash
cd project/ntg-shared-library
npm run build
```

The changes will be reflected in your linked projects. You may need to restart your development server.

#### Step 5: Unlink when done

When you're finished testing, unlink the library:

In your project:
```bash
npm unlink @ntg/shared-library
```

In the library directory:
```bash
npm unlink
```

### Method 2: Using Local File Path (Alternative)

You can also reference the library directly in your `package.json`:

```json
{
  "dependencies": {
    "@ntg/shared-library": "file:../ntg-shared-library"
  }
}
```

Then run:
```bash
npm install
```

### Method 3: Using Workspaces (Monorepo)

If you're using npm workspaces, add the library to your root `package.json`:

```json
{
  "workspaces": [
    "apps/*",
    "ntg-shared-library"
  ]
}
```

Then run from the root:
```bash
npm install
```

## Publishing the Library

### Prerequisites for Publishing

1. **NPM Account**: You need an npm account with access to the `@ntg` scope
2. **Authentication**: Configure npm authentication

```bash
npm login
```

For private registries (e.g., GitHub Packages):
```bash
npm config set @ntg:registry https://npm.pkg.github.com
npm config set //npm.pkg.github.com/:_authToken YOUR_TOKEN
```

### Publishing Steps

1. **Update Version**

   Update the version in `package.json`:
   ```json
   {
     "version": "1.0.1"
   }
   ```

   Or use npm version commands:
   ```bash
   npm version patch  # 1.0.0 -> 1.0.1
   npm version minor  # 1.0.0 -> 1.1.0
   npm version major  # 1.0.0 -> 2.0.0
   ```

2. **Build the Library**

   ```bash
   npm run build
   ```

3. **Test the Build**

   Verify the `dist` directory contains:
   - Compiled JavaScript files
   - TypeScript declaration files (`.d.ts`)
   - Source maps (`.map`)

4. **Publish to npm**

   For public npm:
   ```bash
   npm publish --access public
   ```

   For private registry:
   ```bash
   npm publish
   ```

   For scoped packages (already scoped as `@ntg/shared-library`):
   ```bash
   npm publish --access restricted
   ```

5. **Verify Publication**

   Check that the package is available:
   ```bash
   npm view @ntg/shared-library
   ```

### Publishing Options

#### Public npm Registry
```bash
npm publish --access public
```

#### GitHub Packages
1. Set up `.npmrc` in the library directory:
```
@ntg:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

2. Update `package.json`:
```json
{
  "publishConfig": {
    "registry": "https://npm.pkg.github.com"
  }
}
```

3. Publish:
```bash
npm publish
```

#### Private npm Registry
```bash
npm publish --registry https://your-registry.com
```

## Using the Published Library

### Installation

#### From Public npm
```bash
npm install @ntg/shared-library
```

#### From GitHub Packages
1. Create `.npmrc` in your project root:
```
@ntg:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

2. Install:
```bash
npm install @ntg/shared-library
```

#### From Private Registry
```bash
npm install @ntg/shared-library --registry https://your-registry.com
```

### Usage in Frontend (Next.js)

1. **Install the library**:
```bash
npm install @ntg/shared-library
```

2. **Import and use components**:
```typescript
// In your component file
import { 
  useTheme, 
  ThemeToggle, 
  DynamicThemeProvider,
  useDebounce,
  ErrorBoundary,
  LanguageSwitcher,
  RTLProvider
} from '@ntg/shared-library';

// In your app layout
import { DynamicThemeProvider, RTLProvider } from '@ntg/shared-library';

export default function RootLayout({ children }) {
  return (
    <DynamicThemeProvider>
      <RTLProvider>
        {children}
      </RTLProvider>
    </DynamicThemeProvider>
  );
}
```

3. **Use hooks**:
```typescript
import { useTheme, useDebounce } from '@ntg/shared-library';

function MyComponent() {
  const { theme, toggleTheme } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  
  // Use debouncedSearch for API calls
}
```

### Usage in Backend (NestJS)

1. **Install the library**:
```bash
npm install @ntg/shared-library
```

2. **Import and use guards**:
```typescript
// In your controller
import { 
  JwtAuthGuard, 
  RolesGuard, 
  Roles,
  CurrentUser 
} from '@ntg/shared-library/backend';

@Controller('api/users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  @Get('profile')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'USER')
  getProfile(@CurrentUser() user: any) {
    return user;
  }
}
```

3. **Use services**:
```typescript
// In your module
import { LoggerModule, CacheModule, RedisModule } from '@ntg/shared-library/backend';

@Module({
  imports: [
    LoggerModule,
    CacheModule,
    RedisModule,
  ],
})
export class AppModule {}
```

4. **Use middleware**:
```typescript
// In your app module
import { LoggingMiddleware, SecurityHeadersMiddleware } from '@ntg/shared-library/backend';

export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggingMiddleware, SecurityHeadersMiddleware)
      .forRoutes('*');
  }
}
```

## Troubleshooting

### Issue: Module not found

**Problem**: `Cannot find module '@ntg/shared-library'`

**Solutions**:
1. Ensure the library is installed: `npm install @ntg/shared-library`
2. Check that the library is built: `cd ntg-shared-library && npm run build`
3. Verify the import path is correct
4. Clear node_modules and reinstall: `rm -rf node_modules && npm install`

### Issue: Type errors

**Problem**: TypeScript cannot find type definitions

**Solutions**:
1. Ensure the library is built: `npm run build` in the library directory
2. Check that `dist/index.d.ts` exists
3. Restart your TypeScript server in your IDE
4. Verify `package.json` has `"types": "dist/index.d.ts"`

### Issue: Changes not reflected

**Problem**: Changes to the library don't appear in your project

**Solutions**:
1. Rebuild the library: `cd ntg-shared-library && npm run build`
2. If using npm link, restart your development server
3. Clear your project's build cache
4. Verify the link is active: `npm ls @ntg/shared-library`

### Issue: Peer dependency warnings

**Problem**: Warnings about missing peer dependencies

**Solutions**:
1. Install the required peer dependencies in your project
2. Check the library's `package.json` for peer dependency requirements
3. Ensure versions match the peer dependency requirements

### Issue: Build errors

**Problem**: Library fails to build

**Solutions**:
1. Check TypeScript errors: `npm run build`
2. Ensure all dependencies are installed: `npm install`
3. Verify `tsconfig.json` is correct
4. Check for circular dependencies

### Issue: Publishing fails

**Problem**: `npm publish` fails

**Solutions**:
1. Verify you're logged in: `npm whoami`
2. Check package name and version are correct
3. Ensure `.npmignore` or `files` in `package.json` is configured correctly
4. For scoped packages, use `--access public` or `--access restricted`
5. Check registry permissions

## Development Workflow

### Recommended Workflow

1. **Make changes** in `ntg-shared-library/src/`
2. **Build** the library: `npm run build`
3. **Test locally** using `npm link` in your projects
4. **Update version** when ready: `npm version patch|minor|major`
5. **Publish** to npm: `npm publish`
6. **Update projects** to use the new version: `npm install @ntg/shared-library@latest`

### Version Strategy

- **Patch** (1.0.0 → 1.0.1): Bug fixes, no breaking changes
- **Minor** (1.0.0 → 1.1.0): New features, backward compatible
- **Major** (1.0.0 → 2.0.0): Breaking changes

## Additional Resources

- [npm Documentation](https://docs.npmjs.com/)
- [TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)
- [npm link Documentation](https://docs.npmjs.com/cli/v8/commands/npm-link)

## Support

For issues or questions, please contact the development team or create an issue in the repository.

