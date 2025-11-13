# Supabase Migration Plan

## Overview

This document outlines the strategy and plan for migrating the ticketing system from the current NestJS + Prisma + PostgreSQL stack to Supabase. The migration will leverage Supabase's built-in features (auth, real-time, storage) while maintaining the existing business logic and data structure.

---

## Current Architecture

### Backend
- **Framework:** NestJS
- **ORM:** Prisma
- **Database:** PostgreSQL
- **Auth:** NextAuth.js (JWT-based)
- **Real-time:** Socket.io
- **Storage:** Cloudinary (for attachments)

### Frontend
- **Framework:** Next.js 14
- **UI Library:** Mantine
- **State Management:** Zustand
- **Data Fetching:** React Query (TanStack Query)
- **API Client:** Axios with custom interceptors

### Database Schema Summary

**Core Tables:**
- `users` - User accounts with roles
- `tickets` - Main ticket entity
- `comments` - Ticket comments
- `attachments` - File attachments
- `notifications` - User notifications
- `audit_logs` - Audit trail
- `workflows` - Workflow definitions
- `workflow_executions` - Workflow execution history

**Supporting Tables:**
- `categories`, `subcategories` - Ticket categorization
- `custom_fields`, `ticket_custom_fields` - Dynamic fields
- `saved_searches` - User saved searches
- `email_templates` - Email templates
- `system_settings`, `theme_settings` - Configuration
- `integrations` - Third-party integrations

**Total:** ~20 tables with complex relationships

---

## Key Differences: Prisma/PostgreSQL vs Supabase

### 1. Authentication

**Current:**
- Custom JWT implementation with NextAuth.js
- User passwords stored in `users` table
- Role-based access control (RBAC) in application code

**Supabase:**
- Built-in authentication with `auth.users` table
- Row Level Security (RLS) policies for database-level security
- JWT tokens managed by Supabase
- **Migration Impact:** High - Need to migrate auth system

### 2. Database Access

**Current:**
- Prisma Client for type-safe database access
- Direct SQL queries through Prisma
- Application-level query optimization

**Supabase:**
- Supabase Client (PostgREST) for REST API access
- Can still use Prisma (but not recommended for Supabase features)
- Database functions and triggers for complex logic
- **Migration Impact:** Medium - Need to replace Prisma queries

### 3. Real-time Features

**Current:**
- Socket.io for real-time updates
- Custom WebSocket server in NestJS
- Manual subscription management

**Supabase:**
- Built-in real-time subscriptions via Postgres changes
- Automatic WebSocket management
- **Migration Impact:** Low - Can replace Socket.io

### 4. File Storage

**Current:**
- Cloudinary for file uploads
- Custom upload endpoints in NestJS

**Supabase:**
- Supabase Storage (S3-compatible)
- Built-in file management
- **Migration Impact:** Medium - Need to migrate file uploads

---

## Migration Strategy

### Phase 1: Preparation & Setup (Week 1)

#### 1.1 Supabase Project Setup
- [ ] Create Supabase project
- [ ] Configure environment variables
- [ ] Set up database connection
- [ ] Configure authentication providers (if needed)

#### 1.2 Schema Migration
- [ ] Export current Prisma schema
- [ ] Convert Prisma schema to Supabase SQL
- [ ] Create migration scripts
- [ ] Set up Row Level Security (RLS) policies
- [ ] Create database functions for complex queries

#### 1.3 Data Migration Plan
- [ ] Identify data to migrate
- [ ] Create data export scripts
- [ ] Plan migration order (users → tickets → related data)
- [ ] Set up rollback procedures

### Phase 2: Backend Migration (Week 2-3)

#### 2.1 Replace Prisma with Supabase Client
- [ ] Install `@supabase/supabase-js` in backend
- [ ] Create Supabase client wrapper
- [ ] Replace Prisma queries with Supabase queries
- [ ] Update service layer to use Supabase

**Example Migration:**

```typescript
// Before (Prisma)
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: { requestedTickets: true }
});

// After (Supabase)
const { data: user, error } = await supabase
  .from('users')
  .select('*, requestedTickets(*)')
  .eq('id', userId)
  .single();
```

#### 2.2 Authentication Migration
- [ ] Migrate user accounts to Supabase Auth
- [ ] Update NextAuth.js to use Supabase as provider
- [ ] Migrate password hashes (if possible) or force password reset
- [ ] Update session management

#### 2.3 Replace Socket.io with Supabase Realtime
- [ ] Remove Socket.io dependencies
- [ ] Set up Supabase real-time subscriptions
- [ ] Update WebSocket event handlers
- [ ] Test real-time features

#### 2.4 File Storage Migration
- [ ] Set up Supabase Storage buckets
- [ ] Create migration script for existing files
- [ ] Update file upload endpoints
- [ ] Update file URLs in database

### Phase 3: Frontend Migration (Week 4-5)

#### 3.1 Update API Client
- [ ] Replace Axios with Supabase Client (or keep Axios for custom endpoints)
- [ ] Update authentication flow
- [ ] Update API response handling

#### 3.2 Real-time Updates
- [ ] Replace Socket.io client with Supabase real-time
- [ ] Update notification system
- [ ] Update ticket status updates

#### 3.3 File Uploads
- [ ] Update file upload components
- [ ] Use Supabase Storage client
- [ ] Update file preview/display

### Phase 4: Testing & Optimization (Week 6)

#### 4.1 Functional Testing
- [ ] Test all CRUD operations
- [ ] Test authentication flows
- [ ] Test real-time features
- [ ] Test file uploads/downloads
- [ ] Test workflow execution

#### 4.2 Performance Testing
- [ ] Compare query performance
- [ ] Optimize slow queries
- [ ] Test with production-like data volumes
- [ ] Monitor Supabase usage limits

#### 4.3 Security Testing
- [ ] Verify RLS policies
- [ ] Test authentication/authorization
- [ ] Audit data access patterns

### Phase 5: Deployment (Week 7)

#### 5.1 Production Migration
- [ ] Backup current database
- [ ] Run data migration scripts
- [ ] Deploy updated backend
- [ ] Deploy updated frontend
- [ ] Monitor for issues

#### 5.2 Rollback Plan
- [ ] Keep old system running in parallel (if possible)
- [ ] Document rollback procedures
- [ ] Test rollback process

---

## Code Changes Required

### Backend Changes

#### 1. Replace Prisma Client

**File:** `apps/backend/src/prisma.service.ts`
```typescript
// Remove PrismaService
// Create SupabaseService instead
```

**Files to Update:**
- All service files using `prisma.*`
- Repository pattern implementations
- Query builders

#### 2. Update Authentication

**File:** `apps/backend/src/modules/auth/`
- Replace custom JWT with Supabase Auth
- Update user creation/login flows
- Update session management

#### 3. Update Real-time

**File:** `apps/backend/src/modules/websocket/`
- Remove Socket.io server
- Use Supabase real-time (client-side only, or server-side triggers)

#### 4. Update File Storage

**File:** `apps/backend/src/modules/attachments/`
- Replace Cloudinary with Supabase Storage
- Update upload/download endpoints

### Frontend Changes

#### 1. Update API Client

**File:** `apps/frontend/src/services/api/`
- Option 1: Keep Axios, point to Supabase REST API
- Option 2: Use Supabase Client directly
- Update authentication interceptors

#### 2. Update Real-time

**File:** `apps/frontend/src/components/providers/WebSocketProvider.tsx`
- Replace Socket.io client with Supabase real-time
- Update subscription logic

#### 3. Update File Uploads

**File:** `apps/frontend/src/components/forms/`
- Use Supabase Storage client
- Update file upload components

---

## Database Schema Considerations

### Row Level Security (RLS) Policies

Supabase uses RLS for security. Example policies needed:

```sql
-- Users can only see their own data
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (auth.uid() = id);

-- Support staff can view all tickets
CREATE POLICY "Support staff can view tickets"
ON tickets FOR SELECT
USING (
  auth.jwt() ->> 'role' IN ('SUPPORT_STAFF', 'SUPPORT_MANAGER', 'ADMIN')
  OR requester_id = auth.uid()
);
```

### Database Functions

Complex queries should be moved to database functions:

```sql
-- Example: Get user tickets with stats
CREATE FUNCTION get_user_tickets(user_id UUID)
RETURNS TABLE (
  ticket_id UUID,
  title TEXT,
  status TEXT,
  created_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT t.id, t.title, t.status, t.created_at
  FROM tickets t
  WHERE t.requester_id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Indexes

Current Prisma indexes should be preserved:
- `tickets.status`
- `tickets.assigned_to_id`
- `tickets.requester_id`
- `comments.ticket_id`
- `notifications.user_id, is_read`

---

## Migration Checklist

### Pre-Migration
- [ ] Document current system architecture
- [ ] Backup all data
- [ ] Test migration on staging environment
- [ ] Set up Supabase project
- [ ] Create migration scripts

### During Migration
- [ ] Migrate database schema
- [ ] Migrate user accounts
- [ ] Migrate ticket data
- [ ] Migrate file attachments
- [ ] Update application code
- [ ] Test all features

### Post-Migration
- [ ] Verify data integrity
- [ ] Test performance
- [ ] Monitor error logs
- [ ] Update documentation
- [ ] Train team on Supabase

---

## Risks & Mitigation

### Risk 1: Data Loss
**Mitigation:**
- Complete database backup before migration
- Test migration on staging first
- Keep old system running during transition

### Risk 2: Downtime
**Mitigation:**
- Plan migration during low-traffic period
- Use blue-green deployment if possible
- Have rollback plan ready

### Risk 3: Performance Issues
**Mitigation:**
- Test with production-like data volumes
- Optimize queries before migration
- Monitor Supabase usage limits

### Risk 4: Authentication Issues
**Mitigation:**
- Plan for password reset flow
- Test authentication thoroughly
- Have support plan for user issues

---

## Benefits of Migration

1. **Built-in Authentication:** No need to manage JWT tokens manually
2. **Real-time Features:** Native real-time subscriptions
3. **Row Level Security:** Database-level security policies
4. **File Storage:** Integrated storage solution
5. **Scalability:** Supabase handles scaling automatically
6. **Developer Experience:** Better tooling and dashboard
7. **Cost:** Potentially lower costs for smaller teams

---

## Next Steps

1. **Review this plan** with the team
2. **Set up Supabase project** for testing
3. **Create proof of concept** for one feature (e.g., ticket listing)
4. **Estimate effort** for full migration
5. **Schedule migration** timeline
6. **Begin Phase 1** preparation

---

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Migration Guide](https://supabase.com/docs/guides/migrations)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)

---

**Document Version:** 1.0  
**Last Updated:** 2025-11-13  
**Status:** Draft - Ready for Review

