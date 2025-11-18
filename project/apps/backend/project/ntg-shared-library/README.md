# @ntg/shared-library

Shared components, utilities, and services for NTG applications. This library provides reusable code that can be used across multiple projects in both frontend (React/Next.js) and backend (NestJS) applications.

## Installation

```bash
npm install @ntg/shared-library
```

## Features

### Frontend

- **Theme Management**: Dynamic theme system with light/dark/auto modes
- **Internationalization**: RTL support and language utilities
- **Hooks**: Reusable React hooks (debounce, keyboard navigation, theme, RTL)
- **Utilities**: Date formatting, permissions, and common operations
- **Components**: Generic UI components (coming soon)

### Backend

- **Authentication**: JWT guards and authentication utilities
- **Authorization**: Role-based access control guards and decorators
- **Validation**: Input sanitization and validation services
- **Security**: CSRF protection, rate limiting, security headers
- **Logging**: Structured logging service
- **Cache**: Redis integration and caching utilities

## Usage

### Frontend (Next.js/React)

#### Theme Management

```typescript
import { useTheme, DynamicThemeProvider } from '@ntg/shared-library';

function MyComponent() {
  const { theme, toggleTheme, isDark } = useTheme();
  
  return (
    <button onClick={toggleTheme}>
      Current theme: {theme}
    </button>
  );
}

// In your app layout
import { DynamicThemeProvider } from '@ntg/shared-library';

export default function RootLayout({ children }) {
  return (
    <DynamicThemeProvider>
      {children}
    </DynamicThemeProvider>
  );
}
```

#### Hooks

```typescript
import { useDebounce, useKeyboardNavigation } from '@ntg/shared-library';

function SearchComponent() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  
  // Use debouncedSearch for API calls
  
  useKeyboardNavigation([
    {
      key: '/',
      action: () => {
        // Focus search input
      },
      description: 'Focus search',
    },
  ]);
}
```

#### Utilities

```typescript
import { formatDate, formatRelativeTime } from '@ntg/shared-library';

const date = new Date();
console.log(formatDate(date)); // "Jan 15, 2024"
console.log(formatRelativeTime(date)); // "2 hours ago"
```

### Backend (NestJS)

#### Authentication & Authorization

```typescript
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

#### Validation

```typescript
import { SanitizationService } from '@ntg/shared-library/backend';

@Injectable()
export class UsersService {
  constructor(private sanitization: SanitizationService) {}
  
  async createUser(email: string) {
    const sanitizedEmail = this.sanitization.sanitizeEmail(email);
    // Use sanitizedEmail...
  }
}
```

## Documentation

For detailed documentation, see:

- [Local Development Guide](./LOCAL_DEVELOPMENT.md) - How to test, publish, and use the library
- [API Reference](./docs/API.md) - Complete API documentation (coming soon)
- [Examples](./examples/) - Usage examples (coming soon)

## Development

See [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md) for instructions on:

- Setting up local development
- Testing changes locally
- Publishing the library
- Using the published library

## Contributing

1. Make changes in the `src/` directory
2. Build the library: `npm run build`
3. Test locally using `npm link`
4. Update version: `npm version patch|minor|major`
5. Publish: `npm publish`

## License

MIT

## Support

For issues or questions, please contact the development team.

