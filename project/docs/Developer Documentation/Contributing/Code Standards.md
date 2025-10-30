# Code Standards

This document outlines the coding standards, conventions, and best practices for the NTG Ticket project.

## 🎯 Overview

Consistent code standards ensure:
- **Readability**: Code is easy to understand and maintain
- **Collaboration**: Team members can work effectively together
- **Quality**: High-quality, bug-free code
- **Scalability**: Code that can grow with the project

## 📋 General Principles

### Code Quality Principles

**1. Clarity Over Cleverness**
```typescript
// ❌ Clever but unclear
const result = data.filter(x => x.status === 'active').map(x => x.id).reduce((a, b) => a + b, 0);

// ✅ Clear and readable
const activeUserIds = data
  .filter(user => user.status === 'active')
  .map(user => user.id);
const totalActiveUsers = activeUserIds.length;
```

**2. Single Responsibility**
```typescript
// ❌ Multiple responsibilities
class TicketService {
  createTicket(data: CreateTicketDto) { /* ... */ }
  sendEmail(recipient: string, content: string) { /* ... */ }
  generateReport(tickets: Ticket[]) { /* ... */ }
}

// ✅ Single responsibility
class TicketService {
  createTicket(data: CreateTicketDto) { /* ... */ }
}

class EmailService {
  sendEmail(recipient: string, content: string) { /* ... */ }
}

class ReportService {
  generateReport(tickets: Ticket[]) { /* ... */ }
}
```

**3. Fail Fast**
```typescript
// ❌ Silent failures
function processTicket(ticket: Ticket) {
  if (!ticket) return null; // Silent failure
  // ... processing
}

// ✅ Explicit error handling
function processTicket(ticket: Ticket): ProcessedTicket {
  if (!ticket) {
    throw new Error('Ticket is required');
  }
  // ... processing
}
```

## 🔧 TypeScript Standards

### Type Definitions

**Interface Naming**
```typescript
// ✅ Use PascalCase for interfaces
interface CreateTicketRequest {
  title: string;
  description: string;
  priority: TicketPriority;
}

// ✅ Use descriptive names
interface TicketCreationResult {
  ticket: Ticket;
  success: boolean;
  message: string;
}
```

**Type Aliases**
```typescript
// ✅ Use descriptive type aliases
type UserId = string;
type TicketId = string;
type Status = 'active' | 'inactive' | 'pending';

// ✅ Use generic types appropriately
interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}
```

**Enums**
```typescript
// ✅ Use const enums for better performance
const enum TicketStatus {
  NEW = 'NEW',
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED'
}

// ✅ Use string enums for database compatibility
enum TicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}
```

### Function Standards

**Function Naming**
```typescript
// ✅ Use descriptive verb-noun pattern
function createTicket(ticketData: CreateTicketDto): Promise<Ticket> {
  // ...
}

function validateTicketData(data: CreateTicketDto): boolean {
  // ...
}

function sendNotificationToUser(userId: string, message: string): Promise<void> {
  // ...
}
```

**Function Parameters**
```typescript
// ✅ Use object parameters for multiple arguments
function createTicket(options: {
  title: string;
  description: string;
  priority: TicketPriority;
  assignedTo?: string;
}): Promise<Ticket> {
  // ...
}

// ✅ Use default parameters appropriately
function searchTickets(
  query: string,
  limit: number = 20,
  offset: number = 0
): Promise<Ticket[]> {
  // ...
}
```

**Return Types**
```typescript
// ✅ Always specify return types
function calculateTicketMetrics(tickets: Ticket[]): TicketMetrics {
  // ...
}

// ✅ Use Promise<T> for async functions
async function fetchUserTickets(userId: string): Promise<Ticket[]> {
  // ...
}

// ✅ Use void for functions that don't return values
function logTicketActivity(ticketId: string, action: string): void {
  // ...
}
```

## 🏗️ NestJS Backend Standards

### Module Organization

**Module Structure**
```typescript
// ✅ Consistent module structure
@Module({
  imports: [
    // External modules first
    ConfigModule,
    DatabaseModule,
    
    // Internal modules
    UsersModule,
    CategoriesModule,
  ],
  controllers: [TicketsController],
  providers: [TicketsService, TicketsResolver],
  exports: [TicketsService],
})
export class TicketsModule {}
```

**Service Organization**
```typescript
// ✅ Service class structure
@Injectable()
export class TicketsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly logger: Logger,
  ) {}

  // Public methods first
  async createTicket(createTicketDto: CreateTicketDto, user: User): Promise<Ticket> {
    // ...
  }

  async updateTicket(id: string, updateTicketDto: UpdateTicketDto): Promise<Ticket> {
    // ...
  }

  // Private methods last
  private async validateTicketData(data: CreateTicketDto): Promise<void> {
    // ...
  }

  private async logTicketActivity(ticketId: string, action: string): Promise<void> {
    // ...
  }
}
```

### Controller Standards

**Controller Structure**
```typescript
// ✅ Controller with proper decorators
@Controller('tickets')
@ApiTags('tickets')
@UseGuards(AuthGuard('jwt'))
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new ticket' })
  @ApiResponse({ status: 201, description: 'Ticket created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createTicketDto: CreateTicketDto,
    @Request() req: Request,
  ): Promise<Ticket> {
    const user = req.user as User;
    return this.ticketsService.createTicket(createTicketDto, user);
  }
}
```

**Error Handling**
```typescript
// ✅ Use appropriate HTTP status codes
@Post()
async create(@Body() createTicketDto: CreateTicketDto): Promise<Ticket> {
  try {
    return await this.ticketsService.createTicket(createTicketDto);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw new BadRequestException(error.message);
    }
    if (error instanceof NotFoundError) {
      throw new NotFoundException(error.message);
    }
    throw new InternalServerErrorException('Failed to create ticket');
  }
}
```

### DTO Standards

**Validation DTOs**
```typescript
// ✅ Use class-validator decorators
export class CreateTicketDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  @ApiProperty({ description: 'Ticket title', maxLength: 500 })
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  @ApiProperty({ description: 'Ticket description', maxLength: 10000 })
  description: string;

  @IsEnum(TicketPriority)
  @IsOptional()
  @ApiProperty({ description: 'Ticket priority', enum: TicketPriority })
  priority: TicketPriority = TicketPriority.MEDIUM;

  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({ description: 'Category ID' })
  categoryId: string;
}
```

**Response DTOs**
```typescript
// ✅ Use response DTOs for API consistency
export class TicketResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  ticketNumber: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  status: TicketStatus;

  @ApiProperty()
  createdAt: Date;

  constructor(ticket: Ticket) {
    this.id = ticket.id;
    this.ticketNumber = ticket.ticketNumber;
    this.title = ticket.title;
    this.status = ticket.status;
    this.createdAt = ticket.createdAt;
  }
}
```

## ⚛️ React/Frontend Standards

### Component Organization

**Component Structure**
```typescript
// ✅ Functional component with TypeScript
interface TicketCardProps {
  ticket: Ticket;
  onEdit: (ticket: Ticket) => void;
  onDelete: (ticketId: string) => void;
  className?: string;
}

export const TicketCard: React.FC<TicketCardProps> = ({
  ticket,
  onEdit,
  onDelete,
  className,
}) => {
  // Hooks first
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // Event handlers
  const handleEdit = useCallback(() => {
    onEdit(ticket);
  }, [ticket, onEdit]);

  const handleDelete = useCallback(async () => {
    setIsLoading(true);
    try {
      await onDelete(ticket.id);
    } finally {
      setIsLoading(false);
    }
  }, [ticket.id, onDelete]);

  // Render
  return (
    <Card className={className}>
      {/* Component content */}
    </Card>
  );
};
```

**Custom Hooks**
```typescript
// ✅ Custom hook for ticket operations
export const useTickets = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await ticketApi.getTickets();
      setTickets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tickets');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createTicket = useCallback(async (ticketData: CreateTicketDto) => {
    setIsLoading(true);
    try {
      const newTicket = await ticketApi.createTicket(ticketData);
      setTickets(prev => [...prev, newTicket]);
      return newTicket;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create ticket');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    tickets,
    isLoading,
    error,
    fetchTickets,
    createTicket,
  };
};
```

### State Management

**Zustand Store**
```typescript
// ✅ Zustand store with TypeScript
interface TicketStore {
  tickets: Ticket[];
  isLoading: boolean;
  error: string | null;
  selectedTicket: Ticket | null;
  
  // Actions
  setTickets: (tickets: Ticket[]) => void;
  addTicket: (ticket: Ticket) => void;
  updateTicket: (ticket: Ticket) => void;
  removeTicket: (ticketId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  selectTicket: (ticket: Ticket | null) => void;
}

export const useTicketStore = create<TicketStore>((set, get) => ({
  tickets: [],
  isLoading: false,
  error: null,
  selectedTicket: null,

  setTickets: (tickets) => set({ tickets }),
  
  addTicket: (ticket) => set((state) => ({
    tickets: [...state.tickets, ticket]
  })),
  
  updateTicket: (updatedTicket) => set((state) => ({
    tickets: state.tickets.map(ticket =>
      ticket.id === updatedTicket.id ? updatedTicket : ticket
    )
  })),
  
  removeTicket: (ticketId) => set((state) => ({
    tickets: state.tickets.filter(ticket => ticket.id !== ticketId)
  })),
  
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  selectTicket: (selectedTicket) => set({ selectedTicket }),
}));
```

## 🧪 Testing Standards

### Unit Testing

**Test Structure**
```typescript
// ✅ Use describe blocks for organization
describe('TicketsService', () => {
  let service: TicketsService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TicketsService>(TicketsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('createTicket', () => {
    it('should create a ticket successfully', async () => {
      // Arrange
      const createTicketDto: CreateTicketDto = {
        title: 'Test Ticket',
        description: 'Test Description',
        priority: TicketPriority.MEDIUM,
        categoryId: 'category-id',
      };
      
      const expectedTicket: Ticket = {
        id: 'ticket-id',
        ...createTicketDto,
        status: TicketStatus.NEW,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(prismaService.ticket, 'create').mockResolvedValue(expectedTicket);

      // Act
      const result = await service.createTicket(createTicketDto, mockUser);

      // Assert
      expect(result).toEqual(expectedTicket);
      expect(prismaService.ticket.create).toHaveBeenCalledWith({
        data: expect.objectContaining(createTicketDto),
      });
    });

    it('should throw error when validation fails', async () => {
      // Arrange
      const invalidDto = {
        title: '',
        description: '',
        priority: 'INVALID',
        categoryId: '',
      };

      // Act & Assert
      await expect(service.createTicket(invalidDto, mockUser))
        .rejects
        .toThrow(ValidationError);
    });
  });
});
```

### Component Testing

**React Testing Library**
```typescript
// ✅ Component testing with RTL
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TicketCard } from './TicketCard';

const mockTicket: Ticket = {
  id: '1',
  title: 'Test Ticket',
  status: TicketStatus.OPEN,
  priority: TicketPriority.HIGH,
  createdAt: new Date('2024-01-01'),
};

describe('TicketCard', () => {
  it('renders ticket information correctly', () => {
    render(
      <TicketCard
        ticket={mockTicket}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />
    );

    expect(screen.getByText('Test Ticket')).toBeInTheDocument();
    expect(screen.getByText('HIGH')).toBeInTheDocument();
    expect(screen.getByText('OPEN')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    const mockOnEdit = jest.fn();
    
    render(
      <TicketCard
        ticket={mockTicket}
        onEdit={mockOnEdit}
        onDelete={jest.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    
    expect(mockOnEdit).toHaveBeenCalledWith(mockTicket);
  });

  it('calls onDelete when delete button is clicked', async () => {
    const mockOnDelete = jest.fn();
    
    render(
      <TicketCard
        ticket={mockTicket}
        onEdit={jest.fn()}
        onDelete={mockOnDelete}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    
    await waitFor(() => {
      expect(mockOnDelete).toHaveBeenCalledWith('1');
    });
  });
});
```

## 📝 Documentation Standards

### Code Documentation

**Function Documentation**
```typescript
/**
 * Creates a new ticket with the provided information
 * @param createTicketDto - The ticket creation data
 * @param user - The authenticated user creating the ticket
 * @returns Promise resolving to the created ticket
 * @throws {ValidationError} When input validation fails
 * @throws {ForbiddenException} When user lacks permission
 * @example
 * ```typescript
 * const ticket = await ticketsService.createTicket({
 *   title: 'Server Issue',
 *   description: 'Server is not responding',
 *   priority: TicketPriority.HIGH
 * }, currentUser);
 * ```
 */
async createTicket(
  createTicketDto: CreateTicketDto,
  user: User
): Promise<Ticket> {
  // Implementation
}
```

**Interface Documentation**
```typescript
/**
 * Configuration options for ticket creation
 */
interface CreateTicketOptions {
  /** The ticket title (max 500 characters) */
  title: string;
  
  /** Detailed description of the issue */
  description: string;
  
  /** Priority level for the ticket */
  priority: TicketPriority;
  
  /** Optional category for better organization */
  categoryId?: string;
  
  /** Optional due date for SLA tracking */
  dueDate?: Date;
}
```

### API Documentation

**Swagger Documentation**
```typescript
@ApiOperation({ 
  summary: 'Create a new ticket',
  description: 'Creates a new support ticket with the provided information. The ticket will be assigned to the appropriate support staff based on category and availability.'
})
@ApiResponse({ 
  status: 201, 
  description: 'Ticket created successfully',
  type: TicketResponseDto
})
@ApiResponse({ 
  status: 400, 
  description: 'Invalid input data',
  type: ValidationErrorResponse
})
@ApiResponse({ 
  status: 401, 
  description: 'Authentication required'
})
@ApiResponse({ 
  status: 403, 
  description: 'Insufficient permissions'
})
@Post()
async create(@Body() createTicketDto: CreateTicketDto): Promise<Ticket> {
  // Implementation
}
```

## 🔧 Tooling Configuration

### ESLint Configuration

```json
// .eslintrc.js
{
  "extends": [
    "@nestjs/eslint-config",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/prefer-readonly": "error",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

### Prettier Configuration

```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

### TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true
  }
}
```

## 🎯 Best Practices Summary

### Code Organization
- Use clear, descriptive names for variables, functions, and classes
- Keep functions small and focused on a single responsibility
- Use TypeScript types and interfaces for better code safety
- Organize imports: external libraries first, then internal modules

### Error Handling
- Use appropriate HTTP status codes
- Provide meaningful error messages
- Log errors with sufficient context
- Handle edge cases gracefully

### Performance
- Use async/await instead of callbacks
- Implement proper caching strategies
- Optimize database queries
- Use pagination for large datasets

### Security
- Validate all inputs
- Use parameterized queries to prevent SQL injection
- Implement proper authentication and authorization
- Sanitize user inputs

### Testing
- Write tests for all public methods
- Use descriptive test names
- Test both success and failure cases
- Maintain good test coverage

---

*Follow these standards to ensure consistent, high-quality code across the NTG Ticket project. For Git workflow guidelines, see [Git Workflow](./Git%20Workflow.md).*
