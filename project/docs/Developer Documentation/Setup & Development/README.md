# Setup & Development

This section provides comprehensive guides for setting up the development environment, implementing testing strategies, and deploying the NTG Ticket system.

## 📋 Development Guides

Complete guides for getting started with development:

- **[Local Environment](./Local%20Environment.md)** - Setting up your local development environment
- **[Testing Guide](./Testing%20Guide.md)** - Testing strategies, tools, and best practices
- **[Deployment Guide](./Deployment%20Guide.md)** - Production deployment procedures and strategies

## 🚀 Quick Start

### Prerequisites

**Required Software**
- Node.js 18+ and npm
- Docker and Docker Compose
- Git
- PostgreSQL 15+ (if not using Docker)
- Redis 7+ (if not using Docker)

**Recommended Tools**
- VS Code with TypeScript and ESLint extensions
- Postman or Insomnia for API testing
- pgAdmin or DBeaver for database management
- RedisInsight for Redis management

### Quick Setup

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd ntg-ticket
   ```

2. **Start Infrastructure**
   ```bash
   cd project
   docker-compose up -d
   ```

3. **Setup Backend**
   ```bash
   cd apps/backend
   npm install
   npm run db:push
   npm run db:seed
   npm run dev
   ```

4. **Setup Frontend**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

5. **Access Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - GraphQL Playground: http://localhost:3001/graphql

## 🏗️ Development Workflow

### Git Workflow

**Branch Strategy**
- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/*`: Feature development branches
- `hotfix/*`: Critical production fixes

**Commit Convention**
```bash
# Feature commits
feat: add ticket assignment functionality

# Bug fixes
fix: resolve ticket status update issue

# Documentation
docs: update API documentation

# Refactoring
refactor: improve database query performance

# Testing
test: add unit tests for ticket service
```

### Development Process

1. **Create Feature Branch**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/ticket-assignment
   ```

2. **Develop Feature**
   - Write code following coding standards
   - Add tests for new functionality
   - Update documentation as needed
   - Ensure all tests pass

3. **Create Pull Request**
   - Push feature branch to remote
   - Create pull request to `develop` branch
   - Request code review
   - Address feedback and make changes

4. **Merge and Deploy**
   - Merge approved PR to `develop`
   - Deploy to staging environment
   - Test in staging environment
   - Merge to `main` for production release

## 🛠️ Development Tools

### Code Quality Tools

**Linting and Formatting**
```json
// .eslintrc.js
{
  "extends": [
    "@nestjs/eslint-config",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn"
  }
}
```

**Pre-commit Hooks**
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

### Development Scripts

**Backend Scripts**
```json
{
  "scripts": {
    "dev": "nest start --watch",
    "build": "nest build",
    "start": "node dist/main",
    "lint": "eslint \"src/**/*.ts\" --fix",
    "format": "prettier --write \"src/**/*.{ts,js,json,md}\"",
    "test": "jest",
    "test:e2e": "jest --config ./test/jest-e2e.json",
    "test:cov": "jest --coverage",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio"
  }
}
```

**Frontend Scripts**
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "format": "prettier --write \"src/**/*.{ts,tsx,js,jsx,json,css,md}\"",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "type-check": "tsc --noEmit"
  }
}
```

## 🔧 Environment Configuration

### Environment Variables

**Backend Environment (.env)**
```bash
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ntg_ticket"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d

# File Storage
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_BUCKET=ntg-ticket-files
AWS_REGION=us-east-1

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Elasticsearch
ELASTICSEARCH_NODE=http://localhost:9200

# Application
PORT=3001
NODE_ENV=development
RATE_LIMIT_TTL=60
RATE_LIMIT_LIMIT=100
```

**Frontend Environment (.env.local)**
```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:3001/graphql
NEXT_PUBLIC_WS_URL=ws://localhost:3001

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret

# File Upload
NEXT_PUBLIC_MAX_FILE_SIZE=10485760
NEXT_PUBLIC_ALLOWED_FILE_TYPES=image/jpeg,image/png,application/pdf
```

### Docker Configuration

**Development Docker Compose**
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ntg_ticket
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data

volumes:
  postgres_data:
  redis_data:
  elasticsearch_data:
```

## 🧪 Testing Strategy

### Testing Pyramid

**Unit Tests (70%)**
- Test individual functions and methods
- Mock external dependencies
- Fast execution and immediate feedback

**Integration Tests (20%)**
- Test API endpoints and database interactions
- Test service layer with real dependencies
- Verify data flow and business logic

**End-to-End Tests (10%)**
- Test complete user workflows
- Test critical business processes
- Validate system behavior from user perspective

### Testing Tools

**Backend Testing**
- Jest for unit and integration testing
- Supertest for API endpoint testing
- Prisma test utilities for database testing

**Frontend Testing**
- Jest for unit testing
- React Testing Library for component testing
- Playwright for end-to-end testing

## 📊 Monitoring and Debugging

### Development Monitoring

**Application Logs**
```typescript
// Winston logger configuration
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

const logger = WinstonModule.createLogger({
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
  ],
});
```

**Performance Monitoring**
```typescript
// Performance monitoring middleware
@Injectable()
export class PerformanceMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`${req.method} ${req.url} - ${duration}ms`);
    });
    
    next();
  }
}
```

### Debugging Tools

**VS Code Debug Configuration**
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Backend",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/project/apps/backend/dist/main.js",
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal"
    },
    {
      "name": "Debug Frontend",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/project/apps/frontend/node_modules/.bin/next",
      "args": ["dev"],
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal"
    }
  ]
}
```

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

**Build and Test Pipeline**
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: ntg_ticket_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: |
            project/apps/backend/package-lock.json
            project/apps/frontend/package-lock.json
      
      - name: Install dependencies
        run: |
          cd project/apps/backend && npm ci
          cd ../frontend && npm ci
      
      - name: Run linting
        run: |
          cd project/apps/backend && npm run lint
          cd ../frontend && npm run lint
      
      - name: Run tests
        run: |
          cd project/apps/backend && npm run test
          cd ../frontend && npm run test
      
      - name: Build applications
        run: |
          cd project/apps/backend && npm run build
          cd ../frontend && npm run build
```

## 📚 Documentation Standards

### Code Documentation

**TypeScript Documentation**
```typescript
/**
 * Creates a new ticket with the provided information
 * @param createTicketInput - The ticket creation data
 * @param user - The authenticated user creating the ticket
 * @returns Promise resolving to the created ticket
 * @throws {BadRequestException} When input validation fails
 * @throws {ForbiddenException} When user lacks permission
 */
async createTicket(
  createTicketInput: CreateTicketInput,
  user: User
): Promise<Ticket> {
  // Implementation
}
```

**API Documentation**
```typescript
@ApiOperation({ 
  summary: 'Create a new ticket',
  description: 'Creates a new support ticket with the provided information'
})
@ApiResponse({ 
  status: 201, 
  description: 'Ticket created successfully',
  type: Ticket
})
@ApiResponse({ 
  status: 400, 
  description: 'Invalid input data' 
})
@Post()
async create(@Body() createTicketDto: CreateTicketDto) {
  // Implementation
}
```

## 🎯 Best Practices

### Development Best Practices

**Code Organization**
- Follow single responsibility principle
- Use dependency injection
- Implement proper error handling
- Write self-documenting code

**Performance Considerations**
- Optimize database queries
- Implement proper caching
- Use pagination for large datasets
- Monitor memory usage

**Security Practices**
- Validate all inputs
- Implement proper authentication
- Use environment variables for secrets
- Regular security updates

### Git Best Practices

**Commit Messages**
- Use conventional commit format
- Write clear, descriptive messages
- Keep commits atomic and focused
- Reference issues in commit messages

**Branch Management**
- Keep branches short-lived
- Regular rebasing with main branch
- Clean up merged branches
- Use descriptive branch names

---

*Ready to start developing? Begin with the [Local Environment Setup](./Local%20Environment.md) guide for detailed setup instructions.*
