# Multi-Tenancy Implementation Plan for NTG-Tickets

## Status: ✅ IMPLEMENTED

This document describes the multi-tenancy architecture that has been implemented.

## Overview

Transform the current single-tenant ticketing system into a multi-tenant SaaS application where each organization operates in complete isolation.

---

## 1. Database Schema Changes

### New Models

**Tenant (Organization)**
- ID, name, slug (URL-friendly), optional custom domain
- Status (active/inactive), plan tier (FREE, BASIC, PRO, ENTERPRISE)
- Max users limit, timestamps
- Relations to all organization-scoped data

**TenantInvitation**
- ID, tenant reference, invitee email, assigned roles
- Inviter reference, unique token, expiration date
- Status (pending, accepted, expired - computed from expiresAt and acceptedAt)
- Acceptance timestamp, created timestamp

### Existing Model Modifications

**User Model**
- Add required `tenantId` field linking to organization
- Keep email globally unique (one email = one organization)
- Add relation to sent invitations
- Add composite index on email + tenantId

**All Other Models**
- Add `tenantId` to: Category, Subcategory, Ticket, Comment, Attachment, TicketHistory, Notification, CustomField, EmailTemplate, SavedSearch, AuditLog, SystemSettings, ThemeSettings, Integration, Workflow, and all workflow-related models

---

## 2. Authentication & Signup Flows

### A. Admin Signup (New Organization Registration)

1. User visits signup page
2. Fills form: Organization Name, Admin Name, Email, Password
3. System creates Tenant record
4. System creates User in Supabase Auth
5. System creates User record with tenantId and ADMIN role
6. Verification email sent
7. Redirect to dashboard

### B. User Invitation Flow

1. Admin navigates to user management and clicks "Invite User"
2. Fills: Email, Name, Role(s)
3. System validates email isn't already in this organization
4. System creates TenantInvitation with secure token
5. Invitation email sent with acceptance link
6. Invited user clicks link
7. System validates token and expiry
8. User sees "Set Password" form with pre-filled email and organization name
9. On submit: Supabase Auth user created, User record created with tenantId, invitation marked accepted
10. Redirect to signin

### C. Signin Flow

1. User enters email and password
2. Supabase Auth validates credentials
3. Backend fetches User with tenantId
4. JWT token includes: userId, tenantId, roles
5. All subsequent API calls automatically filtered by tenantId

---

## 3. Backend Implementation

### Tenant Context Middleware
- Extract tenantId from authenticated user's JWT
- Attach tenantId to request context for all downstream operations

### Tenant-Scoped Data Access
- Create request-scoped service that automatically filters all database queries by tenantId
- Ensures users can only access data belonging to their organization

### Tenant Isolation Guard
- Verify any resource being accessed belongs to the user's organization
- Reject cross-tenant access attempts with forbidden error

---

## 4. Frontend Implementation

### New Pages
- `/auth/signup` - Organization registration for new admins
- `/auth/accept-invite` - Password setup for invited users
- `/admin/users/invite` - User invitation interface
- `/admin/users/invitations` - View all invitations with status filter (pending, accepted, expired), ability to resend expired invitations

### Auth Store Updates
- Add tenant/organization object alongside user
- Store organization context for UI display (organization name, branding)

---

## 5. Email Templates

### Invitation Email
- Subject: Invitation to join [Organization Name] on NTG Tickets
- Body: Inviter name, organization name, assigned role, acceptance link
- Link expiration notice (30 days)

### Welcome Email (New Organization)
- Subject: Welcome to NTG Tickets
- Body: Getting started guide, admin setup checklist

---

## 6. Migration Strategy

### Fresh Start Approach (No Data Preservation)

1. Drop all existing tables
2. Create new schema with Tenant, TenantInvitation, and tenantId on all models
3. All tenantId fields are required from the start
4. No backward compatibility considerations

### Phase 1: Schema & Backend
1. Update Prisma schema with all multi-tenant models
2. Run prisma migrate reset (wipes database)
3. Update seed data to create sample organization(s) with users attached to tenantId
4. Implement tenant middleware and guards
5. Update all services to filter by tenant
6. Add signup and invitation endpoints
7. Modify auth flow to include tenantId in JWT

### Phase 2: Frontend
1. Build signup page
2. Build invitation acceptance page
3. Add invitation UI to user management
4. Update auth store with organization context

---

## 7. Security Considerations

- **Row-Level Security**: Consider Supabase RLS policies as defense-in-depth
- **API Validation**: Always verify tenantId from JWT, never trust request body
- **Cross-Tenant Prevention**: Reject any attempt to access another organization's data
- **Invitation Tokens**: Cryptographically secure, 30-day expiration
- **Email Uniqueness**: One email can only belong to one organization

---

## 8. Implementation Order

1. Database schema changes and migration scripts
2. Tenant model with CRUD operations
3. TenantInvitation model with email service integration
4. Auth updates to include tenantId in JWT
5. Tenant middleware and guards on all routes
6. Update all services for tenant-scoped queries
7. Frontend signup page
8. Frontend invitation acceptance page
9. Frontend user invitation UI in admin panel
10. End-to-end testing

---

## 9. New API Endpoints

- **POST /auth/signup** - Register new organization with admin
- **POST /auth/accept-invite** - Accept invitation and set password
- **GET /invitations/validate/:token** - Validate invitation token
- **POST /tenants/invitations** - Send user invitation (Admin only)
- **GET /tenants/invitations** - List all invitations (pending, accepted, expired)
- **GET /tenants/invitations?status=pending** - Filter by status
- **GET /tenants/invitations?status=expired** - View expired invitations
- **GET /tenants/invitations?status=accepted** - View accepted invitations
- **DELETE /tenants/invitations/:id** - Cancel/revoke invitation
- **POST /tenants/invitations/:id/resend** - Resend expired invitation (creates new token, resets expiry)

---

## 10. Role Behavior in Multi-Tenant Context

Existing roles remain unchanged but scoped to organization:
- **ADMIN**: Full access within their organization, can invite users, manage settings
- **SUPPORT_MANAGER**: Manage tickets and staff within organization
- **SUPPORT_STAFF**: Handle tickets within organization
- **END_USER**: Create and view own tickets within organization

Each organization operates completely independently with their own users, tickets, workflows, categories, and settings.

