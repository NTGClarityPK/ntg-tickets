# API Design

This document provides comprehensive documentation of the NTG Ticket API design, including GraphQL schema, REST endpoints, authentication mechanisms, and integration patterns.

## 🎯 API Overview

### API Architecture
The NTG Ticket system implements a **GraphQL-first API** with complementary REST endpoints for specific use cases. This hybrid approach provides flexibility for client applications while maintaining performance and developer experience.

### Design Principles
- **Type Safety**: Strong typing with TypeScript and GraphQL
- **Performance**: Optimized queries with data loading strategies
- **Security**: Comprehensive authentication and authorization
- **Scalability**: Efficient caching and query optimization
- **Developer Experience**: Clear documentation and tooling support

## 🔧 GraphQL API

### Schema Design

#### Core Types

**User Type**
```graphql
type User {
  id: ID!
  email: String!
  name: String!
  role: UserRole!
  isActive: Boolean!
  avatar: String
  createdAt: DateTime!
  updatedAt: DateTime!
  
  # Relations
  requestedTickets: [Ticket!]!
  assignedTickets: [Ticket!]!
  comments: [Comment!]!
  notifications: [Notification!]!
}

enum UserRole {
  END_USER
  SUPPORT_STAFF
  SUPPORT_MANAGER
  ADMIN
}
```

**Ticket Type**
```graphql
type Ticket {
  id: ID!
  ticketNumber: String!
  title: String!
  description: String!
  category: String!
  subcategory: String!
  priority: TicketPriority!
  status: TicketStatus!
  impact: TicketImpact!
  urgency: TicketUrgency!
  slaLevel: SLALevel!
  requester: User
  assignedTo: User
  dueDate: DateTime
  resolution: String
  createdAt: DateTime!
  updatedAt: DateTime!
  closedAt: DateTime
  
  # Computed fields
  resolutionTime: Int
  responseTime: Int
  slaCompliance: Float
  
  # Relations
  comments: [Comment!]!
  attachments: [Attachment!]!
}

enum TicketPriority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum TicketStatus {
  NEW
  OPEN
  IN_PROGRESS
  ON_HOLD
  RESOLVED
  CLOSED
  REOPENED
}
```

#### Input Types

**Create Ticket Input**
```graphql
input CreateTicketInput {
  title: String!
  description: String!
  category: String!
  subcategory: String!
  priority: TicketPriority! = MEDIUM
  impact: TicketImpact! = MODERATE
  urgency: TicketUrgency! = NORMAL
  slaLevel: SLALevel! = STANDARD
  relatedTickets: [String!]
  resolution: String
}

input UpdateTicketInput {
  title: String
  description: String
  categoryId: String
  subcategoryId: String
  priority: TicketPriority
  status: TicketStatus
  impact: TicketImpact
  urgency: TicketUrgency
  slaLevel: SLALevel
  assignedToId: String
  resolution: String
}
```

### Query Operations

#### Ticket Queries

**Get Tickets with Pagination**
```graphql
query GetTickets(
  $first: Int! = 20
  $after: String
  $filters: TicketFiltersInput
) {
  tickets(first: $first, after: $after, filters: $filters) {
    edges {
      node {
        id
        ticketNumber
        title
        status
        priority
        requester {
          name
          email
        }
        assignedTo {
          name
        }
        createdAt
        dueDate
      }
      cursor
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
    totalCount
  }
}
```

**Ticket Details Query**
```graphql
query GetTicket($id: String!) {
  ticket(id: $id) {
    id
    ticketNumber
    title
    description
    category
    subcategory
    priority
    status
    impact
    urgency
    slaLevel
    requester {
      id
      name
      email
      avatar
    }
    assignedTo {
      id
      name
      email
      avatar
    }
    dueDate
    resolution
    createdAt
    updatedAt
    closedAt
    comments {
      id
      content
      isInternal
      user {
        name
        avatar
      }
      createdAt
    }
    attachments {
      id
      filename
      fileUrl
      fileSize
      createdAt
    }
    resolutionTime
    responseTime
    slaCompliance
  }
}
```

#### User Queries

**User Profile Query**
```graphql
query GetUser($id: ID!) {
  user(id: $id) {
    id
    name
    email
    role
    avatar
    isActive
    createdAt
    updatedAt
  }
}

query GetUsers {
  users {
    id
    name
    email
    role
    isActive
    createdAt
  }
}
```

#### Dashboard Queries

**Dashboard Data Query**
```graphql
query GetDashboardData {
  myTickets {
    id
    ticketNumber
    title
    status
    priority
    createdAt
  }
  
  assignedTickets {
    id
    ticketNumber
    title
    status
    priority
    requester {
      name
    }
    createdAt
    dueDate
  }
  
  overdueTickets {
    id
    ticketNumber
    title
    priority
    dueDate
    requester {
      name
    }
  }
  
  notifications(userId: "current-user-id") {
    id
    title
    message
    type
    isRead
    createdAt
  }
}
```

### Mutation Operations

#### Ticket Mutations

**Create Ticket**
```graphql
mutation CreateTicket($input: CreateTicketInput!) {
  createTicket(createTicketInput: $input) {
    id
    ticketNumber
    title
    status
    priority
    createdAt
  }
}
```

**Update Ticket**
```graphql
mutation UpdateTicket($id: String!, $input: UpdateTicketInput!) {
  updateTicket(id: $id, updateTicketInput: $input) {
    id
    title
    description
    status
    priority
    updatedAt
  }
}
```

**Assign Ticket**
```graphql
mutation AssignTicket($id: String!, $assignedToId: String!) {
  assignTicket(id: $id, assignedToId: $assignedToId) {
    id
    assignedTo {
      id
      name
    }
    updatedAt
  }
}
```

**Update Ticket Status**
```graphql
mutation UpdateTicketStatus(
  $id: String!
  $status: String!
  $resolution: String
) {
  updateTicketStatus(id: $id, status: $status, resolution: $resolution) {
    id
    status
    resolution
    updatedAt
    closedAt
  }
}
```

#### Comment Mutations

**Add Comment**
```graphql
mutation AddComment($input: CreateCommentInput!) {
  addComment(createCommentInput: $input) {
    id
    content
    isInternal
    user {
      name
      avatar
    }
    createdAt
  }
}
```

### Real-time Subscriptions

#### Ticket Updates Subscription
```graphql
subscription OnTicketUpdate($ticketId: String!) {
  ticketUpdated(ticketId: $ticketId) {
    id
    status
    priority
    assignedTo {
      id
      name
    }
    updatedAt
  }
}
```

#### Notification Subscription
```graphql
subscription OnNotification($userId: String!) {
  notificationAdded(userId: $userId) {
    id
    title
    message
    type
    isRead
    createdAt
  }
}
```

## 🌐 REST API Endpoints

### Authentication Endpoints

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "access_token": "jwt-token",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name",
    "role": "END_USER"
  }
}
```

#### Refresh Token
```http
POST /api/auth/refresh
Authorization: Bearer <refresh-token>

Response:
{
  "access_token": "new-jwt-token"
}
```

### File Upload Endpoints

#### Upload Attachment
```http
POST /api/attachments
Authorization: Bearer <token>
Content-Type: multipart/form-data

ticketId: "ticket-id"
file: <file-data>

Response:
{
  "id": "attachment-id",
  "filename": "document.pdf",
  "fileUrl": "https://storage.example.com/files/attachment-id",
  "fileSize": 1024000,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

#### Download Attachment
```http
GET /api/attachments/{id}/download
Authorization: Bearer <token>

Response: File download
```

### Export Endpoints

#### Export Tickets
```http
GET /api/reports/tickets/export
Authorization: Bearer <token>
Query Parameters:
- format: csv|excel|pdf
- filters: JSON string of filters
- dateRange: startDate,endDate

Response: File download
```

#### Generate Report
```http
POST /api/reports/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "reportType": "ticket_summary",
  "parameters": {
    "dateRange": {
      "start": "2024-01-01",
      "end": "2024-01-31"
    },
    "filters": {
      "status": ["OPEN", "IN_PROGRESS"],
      "priority": ["HIGH", "CRITICAL"]
    }
  }
}

Response:
{
  "reportId": "report-id",
  "status": "generating",
  "downloadUrl": "https://api.example.com/reports/report-id/download"
}
```

## 🔐 Authentication & Authorization

### JWT Authentication

#### Token Structure
```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user-id",
    "email": "user@example.com",
    "role": "SUPPORT_STAFF",
    "permissions": ["tickets:read", "tickets:write"],
    "iat": 1640995200,
    "exp": 1641081600
  }
}
```

#### Token Refresh Strategy
```typescript
// Frontend token refresh logic
const refreshToken = async () => {
  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${refreshToken}`
      }
    });
    
    const { access_token } = await response.json();
    localStorage.setItem('access_token', access_token);
    return access_token;
  } catch (error) {
    // Redirect to login
    window.location.href = '/auth/login';
  }
};
```

### Role-Based Access Control

#### Permission System
```typescript
// Permission definitions
const PERMISSIONS = {
  // Ticket permissions
  'tickets:read': ['END_USER', 'SUPPORT_STAFF', 'SUPPORT_MANAGER', 'ADMIN'],
  'tickets:write': ['SUPPORT_STAFF', 'SUPPORT_MANAGER', 'ADMIN'],
  'tickets:delete': ['ADMIN'],
  'tickets:assign': ['SUPPORT_STAFF', 'SUPPORT_MANAGER', 'ADMIN'],
  
  // User permissions
  'users:read': ['SUPPORT_STAFF', 'SUPPORT_MANAGER', 'ADMIN'],
  'users:write': ['ADMIN'],
  'users:delete': ['ADMIN'],
  
  // Admin permissions
  'admin:access': ['ADMIN'],
  'reports:generate': ['SUPPORT_MANAGER', 'ADMIN'],
  'system:configure': ['ADMIN']
};
```

#### Authorization Guards
```typescript
// NestJS Authorization Guard
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>('permissions', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredPermissions.some((permission) =>
      user.permissions?.includes(permission)
    );
  }
}

// Usage in controllers
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Permissions('tickets:write')
@Post('tickets')
async createTicket(@Body() createTicketDto: CreateTicketDto) {
  // Implementation
}
```

## 🚀 Performance Optimization

### Data Loading Strategies

#### GraphQL DataLoader
```typescript
// User DataLoader for N+1 query prevention
@Injectable()
export class UserDataLoader {
  constructor(private prisma: PrismaService) {}

  createLoader() {
    return new DataLoader<string, User>(async (userIds: string[]) => {
      const users = await this.prisma.user.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          role: true,
        },
      });
      
      const userMap = new Map(users.map(user => [user.id, user]));
      return userIds.map(id => userMap.get(id));
    });
  }
}
```

#### Query Optimization
```typescript
// Optimized ticket resolver with field-level permissions
@ResolveField('assignedTo', () => User)
async assignedTo(
  @Parent() ticket: Ticket,
  @Context('userDataLoader') userLoader: DataLoader<string, User>
) {
  if (!ticket.assignedToId) return null;
  return userLoader.load(ticket.assignedToId);
}

// Batch loading for comments
@ResolveField('comments', () => [Comment])
async comments(
  @Parent() ticket: Ticket,
  @Context('user') user: User
) {
  return this.commentsService.findByTicketId(ticket.id, user.role);
}
```

### Caching Strategy

#### Redis Caching
```typescript
// Cache configuration
@Injectable()
export class CacheService {
  constructor(
    @InjectRedis() private redis: Redis,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  async cacheTicket(ticketId: string, ticket: Ticket) {
    await this.redis.setex(
      `ticket:${ticketId}`,
      3600, // 1 hour TTL
      JSON.stringify(ticket)
    );
  }

  async getCachedTicket(ticketId: string): Promise<Ticket | null> {
    const cached = await this.redis.get(`ticket:${ticketId}`);
    return cached ? JSON.parse(cached) : null;
  }
}
```

#### Query Result Caching
```typescript
// GraphQL query result caching
@Query(() => TicketConnection)
@UseInterceptors(CacheInterceptor)
@CacheTTL(300) // 5 minutes cache
async tickets(
  @Args('first', { type: () => Int }) first: number,
  @Args('after', { type: () => String, nullable: true }) after: string,
  @Args('filters', { type: () => TicketFiltersInput, nullable: true }) filters: TicketFiltersInput
) {
  return this.ticketsService.findAll(first, after, filters);
}
```

## 📊 API Documentation

### OpenAPI/Swagger Integration

#### Swagger Configuration
```typescript
// Swagger setup
const config = new DocumentBuilder()
  .setTitle('NTG Ticket API')
  .setDescription('IT Service Management API')
  .setVersion('1.0')
  .addBearerAuth()
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);
```

#### API Documentation Examples
```typescript
// Controller with Swagger documentation
@ApiTags('tickets')
@Controller('tickets')
export class TicketsController {
  @Post()
  @ApiOperation({ summary: 'Create a new ticket' })
  @ApiResponse({ status: 201, description: 'Ticket created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiBody({ type: CreateTicketDto })
  async create(@Body() createTicketDto: CreateTicketDto) {
    // Implementation
  }
}
```

### GraphQL Playground

#### Development Configuration
```typescript
// GraphQL Playground setup
app.use('/graphql', graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 10 }));

const server = await app.listen(3000);
console.log(`🚀 GraphQL Playground: http://localhost:3000/graphql`);
```

## 🔄 API Versioning

### Versioning Strategy

#### URL Versioning
```typescript
// API versioning
@Controller('v1/tickets')
export class TicketsV1Controller {
  // V1 implementation
}

@Controller('v2/tickets')
export class TicketsV2Controller {
  // V2 implementation with new features
}
```

#### GraphQL Schema Evolution
```graphql
# Deprecated field with migration path
type Ticket {
  id: ID!
  title: String!
  description: String!
  priority: TicketPriority!
  
  # Deprecated: Use priority instead
  urgency: TicketUrgency! @deprecated(reason: "Use priority field instead")
}
```

## 🛡️ Security Best Practices

### Input Validation

#### DTO Validation
```typescript
export class CreateTicketDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  description: string;

  @IsEnum(TicketPriority)
  @IsOptional()
  priority: TicketPriority = TicketPriority.MEDIUM;

  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @IsUUID()
  @IsNotEmpty()
  subcategoryId: string;
}
```

#### GraphQL Input Validation
```typescript
// Custom scalar validation
const TicketPriorityScalar = new GraphQLScalarType({
  name: 'TicketPriority',
  serialize: (value) => value,
  parseValue: (value) => {
    if (!Object.values(TicketPriority).includes(value)) {
      throw new Error('Invalid ticket priority');
    }
    return value;
  },
  parseLiteral: (ast) => {
    if (ast.kind === Kind.ENUM) {
      return ast.value;
    }
    throw new Error('Invalid ticket priority');
  },
});
```

### Rate Limiting

#### API Rate Limiting
```typescript
// Rate limiting configuration
@UseGuards(ThrottlerGuard)
@Throttle(10, 60) // 10 requests per minute
@Post('tickets')
async createTicket(@Body() createTicketDto: CreateTicketDto) {
  // Implementation
}
```

#### GraphQL Rate Limiting
```typescript
// GraphQL-specific rate limiting
@UseGuards(GraphqlThrottlerGuard)
@Throttle(100, 60) // 100 GraphQL operations per minute
@Query(() => [Ticket])
async tickets() {
  // Implementation
}
```

---

*This API design provides the foundation for the NTG Ticket system's communication layer. For implementation details, see the [Setup & Development](./Setup%20&%20Development/README.md) guides.*
