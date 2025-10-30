# Database Design

This document provides comprehensive documentation of the NTG Ticket database design, including schema details, relationships, optimization strategies, and data management practices.

## 🎯 Database Overview

### Database Technology
- **Primary Database**: PostgreSQL 15
- **ORM**: Prisma 5.7.1
- **Connection Pooling**: pgBouncer (production)
- **Backup Strategy**: Automated daily backups with point-in-time recovery

### Design Principles
- **ACID Compliance**: Ensures data consistency and reliability
- **Normalization**: Third normal form (3NF) to reduce redundancy
- **Performance**: Optimized for read-heavy workloads
- **Scalability**: Prepared for horizontal scaling with read replicas
- **Security**: Row-level security and audit trails

## 📊 Database Schema

### Core Entities

#### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'END_USER',
    is_active BOOLEAN DEFAULT true,
    avatar TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Key Features**:
- UUID primary keys for security and scalability
- Role-based access control with enum types
- Soft delete capability with `is_active` flag
- Automatic timestamp management

#### Tickets Table
```sql
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    category_id UUID NOT NULL REFERENCES categories(id),
    subcategory_id UUID NOT NULL REFERENCES subcategories(id),
    priority ticket_priority DEFAULT 'MEDIUM',
    status ticket_status DEFAULT 'NEW',
    impact ticket_impact DEFAULT 'MODERATE',
    urgency ticket_urgency DEFAULT 'NORMAL',
    sla_level sla_level DEFAULT 'STANDARD',
    requester_id UUID NOT NULL REFERENCES users(id),
    assigned_to_id UUID REFERENCES users(id),
    due_date TIMESTAMP,
    resolution TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    closed_at TIMESTAMP
);
```

**Key Features**:
- Automatic ticket number generation
- Comprehensive status tracking
- SLA level management
- Flexible assignment system

### Enumerations

#### User Roles
```sql
CREATE TYPE user_role AS ENUM (
    'END_USER',
    'SUPPORT_STAFF', 
    'SUPPORT_MANAGER',
    'ADMIN'
);
```

#### Ticket Statuses
```sql
CREATE TYPE ticket_status AS ENUM (
    'NEW',
    'OPEN',
    'IN_PROGRESS',
    'ON_HOLD',
    'RESOLVED',
    'CLOSED',
    'REOPENED'
);
```

#### Priority Levels
```sql
CREATE TYPE ticket_priority AS ENUM (
    'LOW',
    'MEDIUM', 
    'HIGH',
    'CRITICAL'
);
```

## 🔗 Entity Relationships

### Primary Relationships

#### User-Ticket Relationships
```sql
-- Users can create multiple tickets (requester)
ALTER TABLE tickets ADD CONSTRAINT fk_tickets_requester 
    FOREIGN KEY (requester_id) REFERENCES users(id);

-- Users can be assigned multiple tickets
ALTER TABLE tickets ADD CONSTRAINT fk_tickets_assignee 
    FOREIGN KEY (assigned_to_id) REFERENCES users(id);
```

#### Category-Subcategory Hierarchy
```sql
-- Subcategories belong to categories
ALTER TABLE subcategories ADD CONSTRAINT fk_subcategories_category 
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE;

-- Tickets reference both category and subcategory
ALTER TABLE tickets ADD CONSTRAINT fk_tickets_category 
    FOREIGN KEY (category_id) REFERENCES categories(id);
    
ALTER TABLE tickets ADD CONSTRAINT fk_tickets_subcategory 
    FOREIGN KEY (subcategory_id) REFERENCES subcategories(id);
```

### Supporting Tables

#### Comments Table
```sql
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Attachments Table
```sql
CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_url TEXT NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### Audit Logs Table
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    action audit_action NOT NULL,
    resource VARCHAR(100) NOT NULL,
    resource_id UUID,
    field_name VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔍 Database Indexing Strategy

### Primary Indexes

#### Performance-Critical Indexes
```sql
-- Ticket lookups by status and priority
CREATE INDEX idx_tickets_status_priority ON tickets(status, priority);
CREATE INDEX idx_tickets_created_at ON tickets(created_at DESC);

-- User ticket assignments
CREATE INDEX idx_tickets_assigned_to ON tickets(assigned_to_id) WHERE assigned_to_id IS NOT NULL;
CREATE INDEX idx_tickets_requester ON tickets(requester_id);

-- Comment and attachment lookups
CREATE INDEX idx_comments_ticket_id ON comments(ticket_id);
CREATE INDEX idx_attachments_ticket_id ON attachments(ticket_id);

-- Audit log queries
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource, resource_id);
```

#### Full-Text Search Indexes
```sql
-- Full-text search on tickets
CREATE INDEX idx_tickets_search ON tickets USING gin(
    to_tsvector('english', title || ' ' || description)
);

-- Full-text search on comments
CREATE INDEX idx_comments_search ON comments USING gin(
    to_tsvector('english', content)
);
```

#### Composite Indexes
```sql
-- Complex queries optimization
CREATE INDEX idx_tickets_complex ON tickets(status, priority, created_at DESC);
CREATE INDEX idx_tickets_assignment ON tickets(assigned_to_id, status, created_at DESC);
CREATE INDEX idx_audit_logs_user_action ON audit_logs(user_id, action, created_at DESC);
```

### Partial Indexes

#### Conditional Indexes
```sql
-- Active users only
CREATE INDEX idx_users_active ON users(email) WHERE is_active = true;

-- Open tickets only
CREATE INDEX idx_tickets_open ON tickets(assigned_to_id, priority) WHERE status IN ('NEW', 'OPEN', 'IN_PROGRESS');

-- Recent audit logs
CREATE INDEX idx_audit_logs_recent ON audit_logs(user_id, created_at DESC) WHERE created_at > NOW() - INTERVAL '30 days';
```

## 🚀 Performance Optimization

### Query Optimization

#### Common Query Patterns
```sql
-- Dashboard ticket counts
SELECT status, COUNT(*) as count 
FROM tickets 
WHERE created_at >= $1 
GROUP BY status;

-- User's assigned tickets
SELECT t.*, c.name as category_name, s.name as subcategory_name
FROM tickets t
JOIN categories c ON t.category_id = c.id
JOIN subcategories s ON t.subcategory_id = s.id
WHERE t.assigned_to_id = $1 
AND t.status IN ('NEW', 'OPEN', 'IN_PROGRESS')
ORDER BY t.priority DESC, t.created_at DESC;

-- SLA compliance check
SELECT t.*, 
       CASE 
           WHEN t.due_date < NOW() AND t.status NOT IN ('RESOLVED', 'CLOSED') 
           THEN 'BREACHED'
           WHEN t.due_date < NOW() + INTERVAL '1 hour' AND t.status NOT IN ('RESOLVED', 'CLOSED')
           THEN 'AT_RISK'
           ELSE 'COMPLIANT'
       END as sla_status
FROM tickets t
WHERE t.status IN ('NEW', 'OPEN', 'IN_PROGRESS');
```

#### Query Performance Monitoring
```sql
-- Enable query logging for slow queries
ALTER SYSTEM SET log_min_duration_statement = 1000;
ALTER SYSTEM SET log_statement = 'mod';
SELECT pg_reload_conf();

-- Query performance analysis
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

### Connection Management

#### Connection Pooling
```sql
-- Connection pool configuration
-- max_connections = 100
-- shared_buffers = 256MB
-- effective_cache_size = 1GB
-- work_mem = 4MB
-- maintenance_work_mem = 64MB
```

#### Prepared Statements
```sql
-- Use prepared statements for frequently executed queries
PREPARE get_user_tickets(UUID) AS
SELECT * FROM tickets WHERE assigned_to_id = $1 AND status = 'OPEN';

PREPARE update_ticket_status(UUID, VARCHAR, TEXT) AS
UPDATE tickets SET status = $2, resolution = $3, updated_at = NOW() WHERE id = $1;
```

## 🔄 Data Management

### Data Archiving Strategy

#### Historical Data Management
```sql
-- Archive old closed tickets
CREATE TABLE tickets_archive (LIKE tickets INCLUDING ALL);

-- Move closed tickets older than 2 years to archive
INSERT INTO tickets_archive 
SELECT * FROM tickets 
WHERE status = 'CLOSED' 
AND closed_at < NOW() - INTERVAL '2 years';

DELETE FROM tickets 
WHERE status = 'CLOSED' 
AND closed_at < NOW() - INTERVAL '2 years';
```

#### Audit Log Retention
```sql
-- Partition audit logs by month
CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- Automated cleanup of old audit logs
DELETE FROM audit_logs 
WHERE created_at < NOW() - INTERVAL '7 years';
```

### Backup and Recovery

#### Backup Strategy
```bash
# Daily full backup
pg_dump -h localhost -U postgres -d ntg_ticket > backup_$(date +%Y%m%d).sql

# Point-in-time recovery with WAL archiving
archive_mode = on
archive_command = 'cp %p /backup/wal_archive/%f'
```

#### Recovery Procedures
```sql
-- Point-in-time recovery to specific timestamp
pg_restore --create --clean --if-exists backup_20241201.sql

-- Selective table recovery
pg_restore -t tickets -t comments backup_20241201.sql ntg_ticket
```

## 🔒 Security and Compliance

### Row-Level Security

#### User Data Access Control
```sql
-- Enable RLS on sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY user_data_policy ON users
FOR ALL TO authenticated_user
USING (id = current_setting('app.current_user_id')::uuid);

-- Audit logs access policy
CREATE POLICY audit_logs_policy ON audit_logs
FOR SELECT TO support_manager
USING (true);
```

#### Data Encryption
```sql
-- Encrypt sensitive columns
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Encrypt password fields
UPDATE users SET password = crypt(password, gen_salt('bf'));
```

### GDPR Compliance

#### Data Anonymization
```sql
-- Anonymize user data for GDPR compliance
UPDATE users 
SET email = 'anonymized_' || id, 
    name = 'Anonymized User',
    avatar = NULL
WHERE id = $1;
```

#### Data Export
```sql
-- Export user data for GDPR requests
SELECT 
    id,
    email,
    name,
    created_at,
    updated_at
FROM users 
WHERE id = $1;

-- Export user's tickets and comments
SELECT t.*, c.content as comment_content
FROM tickets t
LEFT JOIN comments c ON t.id = c.ticket_id
WHERE t.requester_id = $1;
```

## 📊 Monitoring and Maintenance

### Database Monitoring

#### Performance Metrics
```sql
-- Database size monitoring
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Index usage monitoring
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_tup_read DESC;
```

#### Maintenance Tasks
```sql
-- Regular maintenance tasks
VACUUM ANALYZE;
REINDEX DATABASE ntg_ticket;

-- Update table statistics
ANALYZE tickets, users, comments, attachments;
```

### Health Checks

#### Database Health Monitoring
```sql
-- Connection count monitoring
SELECT count(*) as active_connections 
FROM pg_stat_activity 
WHERE state = 'active';

-- Long-running queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
FROM pg_stat_activity 
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';

-- Lock monitoring
SELECT 
    blocked_locks.pid AS blocked_pid,
    blocked_activity.usename AS blocked_user,
    blocking_locks.pid AS blocking_pid,
    blocking_activity.usename AS blocking_user,
    blocked_activity.query AS blocked_statement
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype;
```

## 🔮 Future Considerations

### Scaling Strategies

#### Read Replicas
```sql
-- Configure read replica for reporting queries
-- Primary: Write operations
-- Replica: Read operations for reports and analytics
```

#### Database Sharding
```sql
-- Prepare for horizontal scaling
-- Shard by user_id or date range
-- Implement shard routing logic
```

### Advanced Features

#### JSON Column Optimization
```sql
-- Optimize JSON queries with GIN indexes
CREATE INDEX idx_tickets_metadata ON tickets USING gin(metadata);

-- JSON path queries
SELECT * FROM tickets 
WHERE metadata @> '{"priority": "high"}'::jsonb;
```

#### Full-Text Search Enhancement
```sql
-- Advanced text search with ranking
SELECT *, ts_rank(to_tsvector('english', title || ' ' || description), query) as rank
FROM tickets, to_tsquery('english', 'search terms') query
WHERE to_tsvector('english', title || ' ' || description) @@ query
ORDER BY rank DESC;
```

---

*This database design provides the foundation for the NTG Ticket system's data layer. For API implementation details, see [API Design](./API%20Design.md).*
