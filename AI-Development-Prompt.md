# AI Development Prompt: NTG-Ticket System

## System Overview
Generate a complete, production-ready IT Ticket Management System called **NTG-Ticket** based on the following comprehensive specifications. This system must be fully operational, deployable, and include all specified features without modifications or additions.

## Core System Requirements

### 1. User Management & Authentication
**Implement four distinct user roles with specific permissions:**
- **End Users:** Can create, view own tickets, add comments, view ticket status
- **IT Support Staff:** Can view assigned tickets, update status, add internal/external comments, resolve tickets
- **IT Support Managers:** Can view all tickets, assign tickets, escalate, generate reports, manage staff
- **System Administrators:** Full system access, user management, system configuration, all permissions

**Authentication Requirements:**
- Email-based authentication using Clerk
- Custom branded login interface with grouped fields
- New user registration with role assignment prompts
- JWT-based session management
- Role-based access control throughout the application

### 2. Complete Ticket Data Model
**Implement all ticket fields exactly as specified:**

| Field | Type | Required | Auto-Generated | Validation |
|-------|------|----------|----------------|------------|
| Ticket ID | Alphanumeric | Yes | Yes | Unique identifier |
| Title | Text (200 chars max) | Yes | No | Non-empty string |
| Description | Text Block | Yes | No | Minimum 10 characters |
| Category | Enum | Yes | No | Hardware, Software, Network, Access, Other |
| Subcategory | Enum (Dependent) | Yes | No | Dynamic based on category |
| Priority | Enum | Yes | Defaulted to Medium | Low, Medium, High, Critical |
| Status | Enum | Yes | Yes | New, Open, In Progress, On Hold, Resolved, Closed, Reopened |
| Assigned To | User ID | No | No | Valid support staff user |
| Requester | User ID | Yes | Yes | Current user ID |
| Creation Date | DateTime | Yes | Yes | ISO timestamp |
| Last Updated | DateTime | Yes | Yes | Auto-updated on changes |
| Due Date | DateTime | No | Calculated | Based on SLA and priority |
| Attachments | File Upload | No | No | Multiple files, 10MB max per file |
| Comments | Text Blocks | No | No | Thread-based communication |
| Resolution | Text Block | Yes* | No | Required before closing ticket |
| SLA Level | Enum | Yes | Defaulted | Standard, Premium, Critical Support |
| Related Tickets | Ticket ID List | No | No | Link to dependencies/duplicates |
| Impact | Enum | Yes | Defaulted | Minor, Moderate, Major, Critical |
| Urgency | Enum | Yes | Defaulted | Low, Normal, High, Immediate |
| Custom Fields | Various | Configurable | No | Admin-configurable fields |

### 3. Ticket Lifecycle & Status Management
**Implement exact status workflow:**
- **New:** Initial state when ticket is created
- **Open:** After initial review and validation
- **In Progress:** When support staff begins work
- **On Hold:** When waiting for external input/resources
- **Resolved:** When solution is implemented
- **Closed:** After user confirmation or auto-closure
- **Reopened:** When closed ticket needs additional work

**Status Transition Rules:**
- New → Open (automatic after submission)
- Open → In Progress (when assigned staff starts work)
- In Progress → On Hold (when waiting for resources)
- On Hold → In Progress (when resources available)
- In Progress → Resolved (when solution implemented)
- Resolved → Closed (after user confirmation or 5 days auto-close)
- Closed → Reopened (if user reports issue persists)
- Any status → Closed (admin override)

### 4. SLA Management System
**Implement three SLA levels with exact timing:**

| SLA Level | Response Time | Resolution Time | Auto-Assignment |
|-----------|---------------|-----------------|-----------------|
| Standard | 8 business hours | 5 business days | General queue |
| Premium | 4 business hours | 2 business days | Senior staff |
| Critical Support | Immediate (24/7) | 4 business hours | Manager escalation |

**SLA Calculations:**
- Business hours: Monday-Friday, 9 AM - 5 PM
- Exclude weekends and holidays
- Automatic escalation when SLA breach imminent
- Visual indicators for SLA status (green/yellow/red)

### 5. Comprehensive Notification System
**Implement all notification types:**
- **Status Change Notifications:** Email alerts for status, assignment, due date changes
- **Due Date Reminders:** Alerts 24 hours and 1 hour before due date
- **Comment Notifications:** Real-time alerts for new comments
- **SLA Breach Warnings:** Escalation alerts to managers
- **Auto-closure Notifications:** 24-hour warning before auto-close

**Notification Channels:**
- In-app notifications with bell icon
- Email notifications with HTML templates
- WebSocket real-time updates
- Optional browser push notifications

### 6. Advanced Reporting & Analytics
**Generate comprehensive reports on:**
- Ticket volume by category, priority, status, time period
- Response time and resolution time analytics
- Staff performance metrics and workload distribution
- SLA compliance rates and breach analysis
- Common issues identification and trend analysis
- Customer satisfaction metrics
- Escalation patterns and reasons

**Report Features:**
- Interactive charts and graphs using Mantine Charts
- Export to PDF and Excel formats
- Scheduled report generation and email delivery
- Custom date range selection
- Drill-down capabilities for detailed analysis

### 7. User Interface Requirements
**Implement all UI specifications:**

**Dashboard Views:**
- **End User Dashboard:** My tickets, recent activity, quick ticket creation
- **Support Staff Dashboard:** Assigned tickets, queue overview, performance metrics
- **Manager Dashboard:** Team performance, SLA monitoring, escalations
- **Admin Dashboard:** System overview, user management, configuration

**Dynamic Form Behavior:**
- Category selection dynamically updates subcategory options
- Priority auto-calculation based on impact and urgency
- Real-time form validation with immediate error feedback
- Progressive disclosure for advanced options

**Responsive Design:**
- Mobile-first approach with Mantine responsive components
- Touch-friendly interface for tablet/mobile devices
- Optimized layouts for different screen sizes
- Accessibility compliance (WCAG 2.1)

### 8. File Management System
**Implement comprehensive file handling:**
- Multiple file upload with drag-and-drop interface
- File type validation (images, documents, logs)
- File size limits (10MB per file, 50MB total per ticket)
- Virus scanning integration
- Secure file storage with signed URLs
- File preview capabilities for common formats
- Automatic thumbnail generation for images

### 9. Search & Filtering System
**Advanced search capabilities:**
- Full-text search across all ticket fields
- Multi-criteria filtering (status, priority, category, date ranges)
- Saved search queries for frequent use
- Quick filters for common scenarios
- Search result highlighting
- Faceted search with result counts
- Export search results

### 10. System Administration Features
**Complete admin panel with:**
- User management (create, edit, deactivate, role assignment)
- Category and subcategory management
- Custom field configuration
- SLA level configuration
- Email template management
- System settings and configuration
- Audit log viewing
- Data backup and restore capabilities

## Technology Stack Implementation

### Frontend (Next.js 14+ Application)
**Required Technologies:**
- **Framework:** Next.js 14+ with App Router and TypeScript
- **UI Library:** Mantine 7.x with complete component suite
- **Authentication:** Clerk with role management
- **State Management:** Zustand for global state
- **Data Fetching:** React Query (TanStack Query) + SWR
- **Forms:** Mantine Form with Zod validation
- **Styling:** Mantine CSS-in-JS with custom theme
- **Icons:** Tabler Icons
- **Charts:** Mantine Charts for analytics
- **File Upload:** Mantine Dropzone
- **Notifications:** Mantine Notifications
- **Date Handling:** Mantine DatePicker
- **Rich Text:** Mantine RichTextEditor

**Frontend Structure:**
```
frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   ├── components/
│   │   ├── ui/                # Reusable UI components
│   │   ├── forms/             # Form components
│   │   ├── layouts/           # Layout components
│   │   └── features/          # Feature-specific components
│   ├── hooks/                 # Custom React hooks
│   ├── stores/                # Zustand stores
│   ├── lib/                   # Utility libraries
│   ├── types/                 # TypeScript definitions
│   └── constants/             # Application constants
└── public/                    # Static assets
```

### Backend (NestJS Application)
**Required Technologies:**
- **Framework:** NestJS with TypeScript
- **API:** GraphQL with Apollo Server + REST endpoints
- **Database:** PostgreSQL 15+ with Prisma ORM
- **Authentication:** Clerk Backend SDK + JWT Guards
- **File Storage:** CloudFlare R2 or AWS S3
- **Email:** NodeMailer
- **Caching:** Redis for sessions and caching
- **Search:** PostgreSQL Full-Text Search + Elasticsearch
- **Background Jobs:** Bull Queue + Redis
- **Validation:** Class Validator + Class Transformer
- **Logging:** Winston + Morgan

**Backend Structure:**
```
backend/
├── src/
│   ├── modules/
│   │   ├── auth/              # Authentication module
│   │   ├── users/             # User management
│   │   ├── tickets/           # Ticket management
│   │   ├── comments/          # Comment system
│   │   ├── notifications/     # Notification system
│   │   ├── reports/           # Reporting module
│   │   ├── files/             # File management
│   │   └── admin/             # Admin functionality
│   ├── common/
│   │   ├── guards/            # Authentication guards
│   │   ├── decorators/        # Custom decorators
│   │   ├── pipes/             # Validation pipes
│   │   └── filters/           # Exception filters
│   ├── database/
│   │   ├── migrations/        # Database migrations
│   │   └── seeds/             # Database seeding
│   └── config/                # Configuration files
└── prisma/                    # Prisma schema and migrations
```

### Database Schema (PostgreSQL)
**Implement complete database schema with these tables:**

```sql
-- Users table
Users (
    id UUID PRIMARY KEY,
    email VARCHAR UNIQUE,
    name VARCHAR,
    role ENUM('END_USER', 'SUPPORT_STAFF', 'SUPPORT_MANAGER', 'ADMIN'),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
)

-- Categories and Subcategories
Categories (
    id UUID PRIMARY KEY,
    name VARCHAR,
    description TEXT,
    is_active BOOLEAN DEFAULT true
)

Subcategories (
    id UUID PRIMARY KEY,
    category_id UUID REFERENCES Categories(id),
    name VARCHAR,
    description TEXT,
    is_active BOOLEAN DEFAULT true
)

-- Main Tickets table
Tickets (
    id UUID PRIMARY KEY,
    ticket_number VARCHAR UNIQUE,
    title VARCHAR(200),
    description TEXT,
    category_id UUID REFERENCES Categories(id),
    subcategory_id UUID REFERENCES Subcategories(id),
    priority ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'),
    status ENUM('NEW', 'OPEN', 'IN_PROGRESS', 'ON_HOLD', 'RESOLVED', 'CLOSED', 'REOPENED'),
    impact ENUM('MINOR', 'MODERATE', 'MAJOR', 'CRITICAL'),
    urgency ENUM('LOW', 'NORMAL', 'HIGH', 'IMMEDIATE'),
    sla_level ENUM('STANDARD', 'PREMIUM', 'CRITICAL_SUPPORT'),
    requester_id UUID REFERENCES Users(id),
    assigned_to UUID REFERENCES Users(id),
    due_date TIMESTAMP,
    resolution TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    closed_at TIMESTAMP
)

-- Comments system
Comments (
    id UUID PRIMARY KEY,
    ticket_id UUID REFERENCES Tickets(id),
    user_id UUID REFERENCES Users(id),
    content TEXT,
    is_internal BOOLEAN DEFAULT false,
    created_at TIMESTAMP
)

-- File attachments
Attachments (
    id UUID PRIMARY KEY,
    ticket_id UUID REFERENCES Tickets(id),
    filename VARCHAR,
    file_size INTEGER,
    file_type VARCHAR,
    file_url VARCHAR,
    uploaded_by UUID REFERENCES Users(id),
    created_at TIMESTAMP
)

-- Ticket history for audit trail
TicketHistory (
    id UUID PRIMARY KEY,
    ticket_id UUID REFERENCES Tickets(id),
    user_id UUID REFERENCES Users(id),
    field_name VARCHAR,
    old_value TEXT,
    new_value TEXT,
    created_at TIMESTAMP
)

-- Custom fields configuration
CustomFields (
    id UUID PRIMARY KEY,
    name VARCHAR,
    field_type ENUM('TEXT', 'NUMBER', 'DATE', 'SELECT', 'BOOLEAN'),
    options JSONB,
    is_required BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true
)

-- Notifications tracking
Notifications (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES Users(id),
    ticket_id UUID REFERENCES Tickets(id),
    type VARCHAR,
    title VARCHAR,
    message TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP
)
```

### Real-time Features
**Implement WebSocket functionality for:**
- Live ticket status updates
- Real-time comment notifications
- Live dashboard updates
- Collaborative editing indicators
- System-wide announcements

### Security Implementation
**Comprehensive security measures:**
- JWT token validation on all protected routes
- Role-based access control (RBAC) middleware
- Input validation and sanitization
- SQL injection prevention with Prisma
- XSS protection with proper escaping
- CSRF protection with tokens
- Rate limiting on API endpoints
- File upload security scanning
- Audit logging for all actions

### Performance Optimization
**Required performance features:**
- Server-side rendering with Next.js
- API response caching with Redis
- Database query optimization with indexes
- Image optimization and lazy loading
- Code splitting and lazy loading
- CDN integration for static assets
- Connection pooling for database
- Background job processing for heavy operations

## Development Requirements

### Code Quality Standards
- **TypeScript:** Strict mode enabled, full type coverage
- **ESLint + Prettier:** Consistent code formatting
- **Testing:** 80%+ test coverage with Jest and React Testing Library
- **Documentation:** JSDoc comments for all public APIs
- **Error Handling:** Comprehensive error boundaries and logging

### Deployment Configuration
**Provide complete deployment setup:**
- Docker containers for frontend and backend
- Docker Compose for local development
- Kubernetes manifests for production deployment
- Environment configuration for different stages
- Database migration scripts
- CI/CD pipeline configuration (GitHub Actions)
- Monitoring and logging setup

### Documentation Requirements
**Generate comprehensive documentation:**
- User manual with screenshots and tutorials
- API documentation with GraphQL schema
- Developer setup and contribution guide
- Deployment and maintenance guide
- Architecture decision records
- Database schema documentation

## Specific Implementation Instructions

### 1. Project Initialization
Create a monorepo structure with proper package management using pnpm workspaces.

### 2. Database Setup
- Implement all database tables with proper relationships
- Create comprehensive seed data for testing
- Set up database migrations and rollback procedures

### 3. Authentication Flow
- Implement Clerk authentication
- Create role-based middleware for route protection
- Set up user registration with role assignment

### 4. Core Ticket Functionality
- Build complete CRUD operations for tickets
- Implement status workflow with validation
- Create comment system with real-time updates

### 5. Notification System
- Set up email templates and sending
- Implement WebSocket for real-time notifications
- Create notification preferences management

### 6. Reporting Dashboard
- Build interactive charts and analytics
- Implement export functionality
- Create scheduled report generation

### 7. Admin Panel
- Create comprehensive admin interface
- Implement user management features
- Build system configuration panels

### 8. File Management
- Set up secure file upload and storage
- Implement file preview and download
- Create file attachment management

### 9. Search and Filtering
- Implement full-text search functionality
- Create advanced filtering interface
- Build saved search functionality

### 10. Testing Suite
- Write comprehensive unit tests
- Create integration tests for API endpoints
- Implement end-to-end tests with Playwright

## Final Deliverables

The generated code must include:

1. **Complete Frontend Application** - Fully functional Next.js app with all UI components
2. **Complete Backend Application** - NestJS API with all endpoints and services
3. **Database Schema** - Complete PostgreSQL schema with migrations
4. **Authentication System** - Clerk integration with role management
5. **Notification System** - Email and real-time notifications
6. **File Upload System** - Secure file handling and storage
7. **Reporting System** - Analytics and report generation
8. **Admin Panel** - Complete system administration interface
9. **Testing Suite** - Comprehensive test coverage
10. **Deployment Configuration** - Docker, Kubernetes, and CI/CD setup
11. **Documentation** - User and developer documentation

## Critical Success Criteria

The system must be:
- **Immediately Deployable** - Ready for production deployment
- **Fully Functional** - All features working as specified
- **Secure** - Production-grade security implementation
- **Scalable** - Handles concurrent users and growing data
- **Maintainable** - Clean, documented, and testable code
- **User-Friendly** - Intuitive interface following UX best practices

Generate the complete, production-ready codebase that satisfies all these requirements without any modifications or additions to the specified functionality.
