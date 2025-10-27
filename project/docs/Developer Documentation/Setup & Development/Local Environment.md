# Local Environment Setup

This guide provides step-by-step instructions for setting up a complete local development environment for the NTG Ticket system.

## 🎯 Overview

This guide will help you set up:
- Local development infrastructure using Docker
- Backend NestJS application with PostgreSQL and Redis
- Frontend Next.js application
- Development tools and configurations
- Testing environment

## 📋 Prerequisites

### Required Software

**Node.js and npm**
```bash
# Check if Node.js is installed
node --version  # Should be 18.0.0 or higher
npm --version   # Should be 8.0.0 or higher

# If not installed, download from https://nodejs.org/
```

**Docker and Docker Compose**
```bash
# Check if Docker is installed
docker --version
docker-compose --version

# If not installed, download from https://www.docker.com/
```

**Git**
```bash
# Check if Git is installed
git --version

# If not installed, download from https://git-scm.com/
```

### Recommended Tools

**VS Code Extensions**
- TypeScript and JavaScript Language Features
- ESLint
- Prettier
- Prisma
- GraphQL
- Docker
- GitLens

**Database Tools**
- pgAdmin or DBeaver for PostgreSQL
- RedisInsight for Redis management

**API Testing**
- Postman or Insomnia for REST API testing
- GraphQL Playground (built into the application)

## 🚀 Quick Setup

### 1. Clone the Repository

```bash
# Clone the repository
git clone <repository-url>
cd ntg-ticket

# Navigate to project directory
cd project
```

### 2. Start Infrastructure Services

```bash
# Start PostgreSQL, Redis, and Elasticsearch
docker-compose up -d

# Verify services are running
docker-compose ps
```

Expected output:
```
Name                     Command               State           Ports
--------------------------------------------------------------------------------
ntg-ticket-postgres     docker-entrypoint.sh postgres    Up      0.0.0.0:5432->5432/tcp
ntg-ticket-redis        docker-entrypoint.sh redis ...   Up      0.0.0.0:6379->6379/tcp
ntg-ticket-elasticsearch docker-entrypoint.sh /usr/l ...  Up      0.0.0.0:9200->9200/tcp
```

### 3. Setup Backend

```bash
# Navigate to backend directory
cd apps/backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# Seed database with initial data
npm run db:seed

# Start development server
npm run dev
```

### 4. Setup Frontend

```bash
# Navigate to frontend directory (in new terminal)
cd apps/frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Start development server
npm run dev
```

### 5. Verify Setup

**Access Applications**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- GraphQL Playground: http://localhost:3001/graphql
- Prisma Studio: http://localhost:5555 (run `npm run db:studio`)

**Test API Connection**
```bash
# Test backend health
curl http://localhost:3001/health

# Expected response: {"status": "ok", "timestamp": "..."}
```

## 🔧 Detailed Setup Instructions

### Environment Configuration

#### Backend Environment Variables

Create `.env` file in `apps/backend/`:

```bash
# Database Configuration
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ntg_ticket"

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=your-refresh-secret-key-change-this-in-production
JWT_REFRESH_EXPIRES_IN=7d

# File Storage (AWS S3 or Local)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_BUCKET=ntg-ticket-files
AWS_REGION=us-east-1
# For local development, you can use local file storage
FILE_STORAGE_TYPE=local

# Email Configuration (Optional for development)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@ntg-ticket.com

# Elasticsearch Configuration
ELASTICSEARCH_NODE=http://localhost:9200

# Application Configuration
PORT=3001
NODE_ENV=development
RATE_LIMIT_TTL=60
RATE_LIMIT_LIMIT=100

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=debug
```

#### Frontend Environment Variables

Create `.env.local` file in `apps/frontend/`:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:3001/graphql
NEXT_PUBLIC_WS_URL=ws://localhost:3001

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-change-this-in-production

# File Upload Configuration
NEXT_PUBLIC_MAX_FILE_SIZE=10485760
NEXT_PUBLIC_ALLOWED_FILE_TYPES=image/jpeg,image/png,application/pdf,text/plain

# Feature Flags
NEXT_PUBLIC_ENABLE_REGISTRATION=true
NEXT_PUBLIC_ENABLE_NOTIFICATIONS=true

# Development Settings
NEXT_PUBLIC_DEBUG_MODE=true
```

### Database Setup

#### Prisma Configuration

The database schema is defined in `apps/backend/prisma/schema.prisma`:

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Your database models are defined here
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  password  String
  role      UserRole @default(END_USER)
  isActive  Boolean  @default(true)
  avatar    String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  requestedTickets    Ticket[]        @relation("TicketRequester")
  assignedTickets     Ticket[]        @relation("TicketAssignee")
  comments            Comment[]
  attachments         Attachment[]
  // ... other relations
}
```

#### Database Initialization

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed database with initial data
npm run db:seed
```

The seed script creates:
- Default admin user
- Sample categories and subcategories
- Test tickets for development
- System settings

#### Database Management

**Prisma Studio**
```bash
# Open Prisma Studio in browser
npm run db:studio
```

**Database Migrations**
```bash
# Create a new migration
npm run db:migrate

# Reset database (WARNING: This will delete all data)
npm run db:reset
```

### Redis Configuration

Redis is used for:
- Session storage
- API response caching
- Background job queues
- Real-time features

**Verify Redis Connection**
```bash
# Connect to Redis CLI
docker exec -it ntg-ticket-redis redis-cli

# Test Redis
127.0.0.1:6379> ping
PONG

# Exit Redis CLI
127.0.0.1:6379> exit
```

### Elasticsearch Configuration

Elasticsearch is used for:
- Full-text search across tickets
- Advanced search capabilities
- Analytics and reporting

**Verify Elasticsearch Connection**
```bash
# Check Elasticsearch health
curl http://localhost:9200/_cluster/health

# Expected response:
{
  "cluster_name": "docker-cluster",
  "status": "green",
  "timed_out": false,
  "number_of_nodes": 1,
  "number_of_data_nodes": 1,
  "active_primary_shards": 0,
  "active_shards": 0,
  "relocating_shards": 0,
  "initializing_shards": 0,
  "unassigned_shards": 0,
  "delayed_unassigned_shards": 0,
  "number_of_pending_tasks": 0,
  "number_of_in_flight_fetch": 0,
  "task_max_waiting_in_queue_millis": 0,
  "active_shards_percent_as_number": 100.0
}
```

## 🧪 Testing Setup

### Unit Testing

**Backend Tests**
```bash
cd apps/backend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov

# Run specific test file
npm test -- tickets.service.spec.ts
```

**Frontend Tests**
```bash
cd apps/frontend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- components/TicketCard.test.tsx
```

### Integration Testing

**API Testing**
```bash
cd apps/backend

# Run integration tests
npm run test:e2e

# Run specific integration test
npm run test:e2e -- tickets.e2e-spec.ts
```

### End-to-End Testing

**Playwright E2E Tests**
```bash
cd apps/frontend

# Install Playwright browsers
npx playwright install

# Run E2E tests
npm run test:e2e

# Run E2E tests in headed mode
npm run test:e2e:headed

# Run specific E2E test
npm run test:e2e -- tests/ticket-creation.spec.ts
```

## 🛠️ Development Tools

### VS Code Configuration

**Workspace Settings** (`.vscode/settings.json`):
```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.next": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.next": true
  }
}
```

**Launch Configuration** (`.vscode/launch.json`):
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
      "console": "integratedTerminal",
      "restart": true,
      "runtimeExecutable": "nodemon",
      "runtimeArgs": ["--exec", "ts-node", "-r", "tsconfig-paths/register"]
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

### Database Tools

**pgAdmin Setup**
1. Download and install pgAdmin
2. Add new server:
   - Host: localhost
   - Port: 5432
   - Database: ntg_ticket
   - Username: postgres
   - Password: postgres

**RedisInsight Setup**
1. Download and install RedisInsight
2. Add new connection:
   - Host: localhost
   - Port: 6379
   - Name: NTG Ticket Redis

### API Testing Tools

**Postman Collection**
Import the provided Postman collection for API testing:
- Authentication endpoints
- Ticket management endpoints
- User management endpoints
- File upload endpoints

**GraphQL Playground**
Access GraphQL Playground at http://localhost:3001/graphql for:
- Interactive GraphQL queries
- Schema exploration
- Query testing and debugging

## 🔍 Troubleshooting

### Common Issues

**Port Already in Use**
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3002 npm run dev
```

**Database Connection Issues**
```bash
# Check if PostgreSQL is running
docker-compose ps

# Restart PostgreSQL
docker-compose restart postgres

# Check database logs
docker-compose logs postgres
```

**Redis Connection Issues**
```bash
# Check if Redis is running
docker-compose ps

# Restart Redis
docker-compose restart redis

# Check Redis logs
docker-compose logs redis
```

**Elasticsearch Issues**
```bash
# Check Elasticsearch status
curl http://localhost:9200/_cluster/health

# Restart Elasticsearch
docker-compose restart elasticsearch

# Check Elasticsearch logs
docker-compose logs elasticsearch
```

### Performance Issues

**Slow Database Queries**
```bash
# Enable query logging in PostgreSQL
# Add to postgresql.conf:
log_statement = 'all'
log_duration = on
log_min_duration_statement = 1000

# Restart PostgreSQL
docker-compose restart postgres
```

**Memory Issues**
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run dev

# Monitor memory usage
npm install -g clinic
clinic doctor -- node dist/main.js
```

### Development Tips

**Hot Reloading**
- Backend: Uses `nest start --watch` for automatic restarts
- Frontend: Uses Next.js built-in hot reloading
- Database: Prisma client auto-regenerates on schema changes

**Debugging**
- Use VS Code debugger for breakpoints
- Enable debug logging with `LOG_LEVEL=debug`
- Use browser dev tools for frontend debugging
- Check application logs in `logs/` directory

**Performance Monitoring**
```bash
# Monitor application performance
npm install -g clinic
clinic doctor -- node dist/main.js

# Monitor database performance
# Use pgAdmin or connect directly to PostgreSQL
```

## 📚 Additional Resources

### Documentation Links
- [NestJS Documentation](https://docs.nestjs.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [GraphQL Documentation](https://graphql.org/learn/)

### Community Resources
- [NestJS Discord](https://discord.gg/nestjs)
- [Next.js GitHub](https://github.com/vercel/next.js)
- [Prisma Community](https://www.prisma.io/community)

---

*Your local development environment is now ready! Continue with the [Testing Guide](./Testing%20Guide.md) to learn about testing strategies.*
