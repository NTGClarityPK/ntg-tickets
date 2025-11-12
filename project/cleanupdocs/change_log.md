# Cleanup Change Log

For every change, append an entry using the template below.

---

## UsersService relation helpers (2025-11-11)

- **Issue:**  
  `UsersService` repeated the same Prisma includes and leaked password hashes when returning users to callers.
- **Resolution:**  
  Centralized ticket relation includes via `USER_TICKET_RELATIONS` and added a reusable `sanitizeUser` helper so every path returns password-free payloads.
- **Before → After:**  
  - Before:  
    Each method inlined `{ requestedTickets: { select ... } }` and returned raw Prisma user objects.  
  - After:  
    Shared include object + `sanitizeUser` ensure consistent data shape without sensitive fields.  
- **Dev Note (how/why):**  
  This lays groundwork for extracting repositories/application services—user fetching logic now has a single include definition and mapper.
- **Product Lead Note (business value):**  
  Cleaner user APIs reduce duplication, lower security risk (no password leakage), and make it easier to reuse the user module in future products.

---

## Centralize configuration & env validation (2025-11-11)

- **Issue:**  
  Environment access (`process.env`) was scattered across services and modules, making configuration brittle and hard to migrate.
- **Resolution:**  
  Added `AppConfigModule` with Joi validation, a typed `AppConfigService`, and refactored Redis/Bull, JWT, WebSocket, email, backup, and admin health checks to consume centralized config.
- **Before → After:**  
  - Before:  
    Modules like `AppModule`, `WebSocketModule`, `AdminService`, and `BackupService` read env vars directly.  
  - After:  
    Shared config service supplies rate limits, Redis/JWT credentials, frontend URLs, SMTP settings, database URL, and file limits.  
- **Dev Note (how/why):**  
  Introduced `ConfigModule.forRoot` with validation schema and async module factories so tests, containers, and Supabase migration share a single source of truth.
- **Product Lead Note (business value):**  
  Centralized configuration reduces deployment risk, enforces missing-env detection early, and keeps infrastructure swaps (e.g., Supabase, new SMTP provider) low effort.

---

## Harden user validation & errors (2025-11-11)

- **Issue:**  
  User endpoints accepted unchecked query params/IDs and bubbled raw Prisma errors, risking confusing responses and inconsistent logging.
- **Resolution:**  
  Added `GetUsersQueryDto` with typed pagination filters, enforced UUID params in the controller, and centralized UsersService error handling with consistent `InternalServerErrorException` wrapping.
- **Before → After:**  
  - Before:  
    `findAll` accepted loose strings (`isActive='true'`) and each catch simply re-threw the original error.  
  - After:  
    DTO-driven query parsing, `ParseUUIDPipe` on `:id`, and a shared `handleServiceError` that logs + emits clean API errors.  
- **Dev Note (how/why):**  
  Validation pipe now gets structured input, and we avoid duplicating error logging in every method.
- **Product Lead Note (business value):**  
  Users API responds with predictable messages, which helps support staff diagnose issues faster and lowers the chance of leaking internal stack traces.

---
## Prisma performance indexes (2025-11-11)

- **Issue:**  
  Ticket, notification, and workflow tables had no secondary indexes, slowing the highest-volume queries (status filters, unread notifications, workflow lookups).
- **Resolution:**  
  Added targeted `@@index` directives for frequent filters (ticket status/assignee/requester, notification `userId + isRead`, audit log timestamps, workflow transitions, etc.).
- **Before → After:**  
  - Before:  
    Full-table scans whenever we fetched tickets by status or unread notifications per user.  
  - After:  
    Schema defines explicit indexes (e.g. `@@index([status])`, `@@index([userId, isRead])`, `@@index([workflowId, isActive])`) ready for migration on the next deploy.  
- **Dev Note (how/why):**  
  The schema change doesn’t alter runtime; run `prisma migrate dev --name add_indexes` (or `prisma db push`) to apply physically.
- **Product Lead Note (business value):**  
  Improves responsiveness of ticket lists, dashboards, and background jobs as the database grows, reducing load spikes ahead of Supabase migration.

---

## Refactor API client into domain clients (2025-11-11)

- **Issue:**  
  The `apiClient.ts` file was 970 lines, mixing axios setup, auth interceptors, and all API endpoints in one place, making it hard to maintain, test, and reuse across projects.
- **Resolution:**  
  Split into a base HTTP client (`http-client.ts`) with auth interceptors, and 15 domain-specific clients (auth, users, tickets, categories, system, etc.) in `services/api/`. Updated `lib/apiClient.ts` to re-export everything for backward compatibility.
- **Before → After:**  
  - Before:  
    Single 970-line file with axios instance, interceptors, and all API methods (`authApi`, `userApi`, `ticketApi`, etc.) mixed together.  
  - After:  
    Base `httpClient` handles auth/token refresh; domain clients (`authClient`, `usersClient`, `ticketsClient`, etc.) in separate files. Legacy `apiClient.ts` re-exports for compatibility.  
- **Dev Note (how/why):**  
  Created `services/api/http-client.ts` for shared axios setup and interceptors. Each domain client (`auth.client.ts`, `users.client.ts`, etc.) imports the base client and exposes typed methods. This separation makes it easier to swap HTTP libraries, mock specific domains in tests, and reuse clients in future projects. The backward-compatible wrapper ensures existing imports continue working.
- **Product Lead Note (business value):**  
  Cleaner code structure makes the frontend easier to maintain and extend. When migrating to Supabase or adding new features, developers can work on specific domains (e.g., tickets) without touching unrelated code. This modularity also makes it easier to reuse ticket/user/auth modules in future applications.

---

## Replace hardcoded admin metrics with real data (2025-11-12)

- **Issue:**  
  `AdminDashboard` displayed hardcoded security metrics (`failedLogins = 3`, `passwordResets = 12`, etc.) instead of consuming real telemetry data from the backend APIs.
- **Resolution:**  
  Updated `AdminDashboard` to use `useSystemStats()`, `useAuditLogStats()`, and `useSystemAuditLogs()` hooks. Metrics are now calculated from real audit logs (failed logins, password resets, active sessions) and system stats (total users, active users, audit entries). Also updated `useSystemMonitoring` and `useAuditLogs` hooks to use the new domain-specific API clients.
- **Before → After:**  
  - Before:  
    Hardcoded values: `const failedLogins = 3; const passwordResets = 12; const auditEntries = 156; const activeSessions = 24;`  
  - After:  
    Real-time calculations from audit logs: `failedLogins` from LOGIN actions with `success: false`, `passwordResets` from user UPDATE actions on password field, `activeSessions` from successful LOGIN actions in last 24 hours, `auditEntries` from `auditLogStats.totalLogs`.  
- **Dev Note (how/why):**  
  Refactored hooks to use `systemClient` and `auditLogsClient` instead of legacy `systemApi`/`auditLogsApi`, ensuring consistency with the new API client architecture. Metrics are calculated by filtering audit logs by action type and metadata, providing accurate security insights. Removed hardcoded trend indicators since historical comparison data isn't available yet.
- **Product Lead Note (business value):**  
  Admin dashboard now shows real-time security metrics, enabling administrators to monitor failed login attempts, password reset activity, and active sessions. This provides actionable insights for security monitoring and helps identify potential security issues early.

---

## Normalize ticket API responses (2025-11-11)

- **Issue:**  
  Ticket-related hooks and stores hard-coded multiple fallback paths like `response.data.data.data`, causing fragile logic and repeated bugs during builds.
- **Resolution:**  
  Added `normalizeListResponse` and `normalizeItemResponse` helpers and refactored ticket hooks to consume the centralized adapters.
- **Before → After:**  
  - Before:  
    `useTickets` manually checked `response.data.data.data` and similar shapes.  
  - After:  
    `useTickets` and `useTicketsStoreSync` call `normalizeListResponse`, ensuring consistent parsing.  
- **Dev Note (how/why):**  
  Created `src/services/api/response-normalizer.ts`, handling nested API structures and future-proofing for contract changes; updated hooks to throw explicit errors when payloads are malformed.
- **Product Lead Note (business value):**  
  Standardized response handling keeps the UI stable when backend formats evolve and reduces time spent debugging data-shape regressions, smoothing the path for Supabase migration.

---

## Fix audit log API response normalization across components (2025-11-12)

- **Issue:**  
  After refactoring API clients and normalizing responses, multiple components (`AdminDashboard`, `AuditLogStats`, `AuditTrail`, `TicketAuditLogs`, `UserActivityLogs`) were still accessing the old nested response structure (`response.data.data`) instead of the normalized `{ items, pagination }` shape. This caused TypeScript build errors and runtime failures.
- **Resolution:**  
  Updated all audit log hooks to properly type responses with `normalizeListResponse<AuditLog>()` and `normalizeItemResponse()`. Fixed all components to use `.items` instead of `.data.data`, added proper `AuditLog` type imports, and fixed type assertions for audit log stats. Also fixed duplicate variable declarations and removed unused imports in `AdminDashboard`.
- **Before → After:**  
  - Before:  
    Components accessed `auditLogs?.data?.data?.map()`, `stats?.data?.totalLogs`, `systemLogs?.data?.data`, causing TypeScript errors. `AdminDashboard` had duplicate `sevenDaysAgo` variable and unused `IconTrendingUp`/`IconTrendingDown` imports.  
  - After:  
    All components use `auditLogs?.items?.map((log: AuditLog) => ...)`, `(statsData as { totalLogs?: number })?.totalLogs`, and proper type assertions. Hooks return typed `NormalizedListResult<AuditLog>` and `NormalizedItemResult` responses.  
- **Dev Note (how/why):**  
  This completes the API response normalization effort started earlier. All audit log-related components now consistently use the normalized response structure, making the codebase more maintainable and type-safe. The type assertions for stats are temporary until we define proper interfaces for audit log statistics.
- **Product Lead Note (business value):**  
  Consistent API response handling ensures the admin dashboard and audit log views work reliably. This reduces bugs and makes it easier to maintain and extend audit logging features in the future.

---

## Ticket workflow orchestration cleanup (2025-11-11)

- **Issue:**  
  `TicketsService` reached into `workflowExecutionService['workflowsService']`, tightly coupling modules and blocking future workflow abstractions.
- **Resolution:**  
  Injected `WorkflowsService` directly, added helpers to resolve default workflow snapshots, and extracted initial-status logic into typed utilities.
- **Before → After:**  
  - Before:  
    `this.workflowExecutionService['workflowsService'].findDefault()` hack plus inline status parsing.  
  - After:  
    Dedicated `resolveDefaultWorkflow()`/`extractInitialStatusFromDefinition()` methods using proper `WorkflowsService` injection.  
- **Dev Note (how/why):**  
  Encapsulating workflow lookup removes brittle private-member access and prepares the service for further decomposition into application layers.
- **Product Lead Note (business value):**  
  Cleaner workflow orchestration reduces the risk of regressions when we swap persistence layers (e.g., Supabase) and makes ticket creation logic reusable across future products.

---