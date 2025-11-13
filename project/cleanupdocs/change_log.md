# Cleanup Change Log

For every change, append an entry using the template below.

---

## Establish shared utilities for formatting, permissions, and SLA helpers (2025-11-12)

- **Issue:**  
  Date formatting (`new Date(...).toLocaleDateString()`), permission checks, and SLA calculations (overdue tickets, breached SLA) were duplicated across multiple components, making it hard to maintain consistency and update logic in one place.
- **Resolution:**  
  Created `lib/utils/` directory with three utility modules:
  - `date.utils.ts` - Centralized date formatting functions (`formatDate`, `formatShortDate`, `formatDateTime`, `formatRelativeTime`, etc.)
  - `permissions.utils.ts` - Simple role-based permission checks (`hasRole`, `isAdmin`, `canManageUsers`, etc.)
  - `sla.utils.ts` - SLA-related calculations (`isTicketOverdue`, `hasTicketBreachedSLA`, `filterOverdueTickets`, etc.)
  Updated components to use these shared utilities instead of inline logic.
- **Before → After:**  
  - Before:  
    ```typescript
    // Duplicated in multiple files
    {new Date(user.createdAt).toLocaleDateString()}
    
    // Duplicated SLA logic
    const overdueTickets = tickets.filter(ticket => {
      if (!ticket.dueDate) return false;
      return new Date(ticket.dueDate) < new Date() && 
             !['RESOLVED', 'CLOSED'].includes(ticket.status);
    });
    ```  
  - After:  
    ```typescript
    // Centralized utility
    import { formatShortDate, filterOverdueTickets } from '../../../lib/utils';
    
    {formatShortDate(user.createdAt)}
    const overdueTickets = filterOverdueTickets(tickets);
    ```  
- **Dev Note (how/why):**  
  Shared utilities ensure consistency across the application. If date formatting needs to change (e.g., different locale or format), you only update one file. The same applies to SLA logic - if business rules change, update the utility function once. This follows the DRY (Don't Repeat Yourself) principle and makes the codebase more maintainable.
- **Product Lead Note (business value):**  
  Consistent date formatting and SLA calculations across the application improve user experience. If business rules for SLA change, developers can update the logic in one place rather than hunting through multiple files. This reduces the risk of bugs and makes the codebase easier to maintain.

---

## Improve state management with selector hooks (2025-11-12)

- **Issue:**  
  Components were accessing `useAuthStore()` directly (e.g., `const { user } = useAuthStore()`), causing unnecessary re-renders whenever ANY part of the auth store changed (user, isAuthenticated, isLoading, etc.), even if the component only needed one value.
- **Resolution:**  
  Created selector hooks (`useAuthUser`, `useAuthIsAuthenticated`, `useAuthIsLoading`, `useAuthActiveRole`, `useAuthUserId`, `useAuthState`, `useAuthActions`) that use Zustand's selector pattern. Components now only re-render when the specific value they subscribe to changes.
- **Before → After:**  
  - Before:  
    ```typescript
    const { user } = useAuthStore();  // ❌ Re-renders on ANY store change
    const { user, isLoading } = useAuthStore();  // ❌ Re-renders on ANY store change
    ```  
  - After:  
    ```typescript
    const user = useAuthUser();  // ✅ Only re-renders when user changes
    const isLoading = useAuthIsLoading();  // ✅ Only re-renders when isLoading changes
    const { setUser, logout } = useAuthActions();  // ✅ Never re-renders (actions are stable)
    ```  
- **Dev Note (how/why):**  
  Zustand selectors work by using a function `state => state.user` instead of destructuring. This tells Zustand to only subscribe to that specific value. When `isLoading` changes but `user` doesn't, components using `useAuthUser()` won't re-render. This is a performance optimization that prevents unnecessary React re-renders, especially important in large applications with many components.
- **Product Lead Note (business value):**  
  This change improves application performance by reducing unnecessary re-renders. Users will experience smoother interactions, especially when multiple components are displayed on the same page. The application will feel more responsive, especially on lower-end devices.

---

## Refactor users list page into feature-based structure (2025-11-12)

- **Issue:**  
  The users list page (`app/admin/users/page.tsx`) was 373 lines, mixing data fetching, filtering logic, role-based access control, and UI rendering in a single file.
- **Resolution:**  
  Created `features/users/` structure and split the users list into `UsersListContainer` (data fetching, filtering, access control) and `UsersListPresenter` (pure UI). Extracted utility functions for user initials and created type definitions.
- **Before → After:**  
  - Before:  
    Single 373-line file with hooks, filtering logic, role-based access checks, and all UI rendering mixed together.  
  - After:  
    `features/users/containers/UsersListContainer.tsx` handles all data fetching, filtering, access control checks, and state management. `features/users/presenters/UsersListPresenter.tsx` is pure UI that receives all data as props. `features/users/types/users.types.ts` defines all interfaces. `features/users/utils/user.utils.ts` contains utility functions like `getUserInitials`.  
- **Dev Note (how/why):**  
  The container handles role-based access control (redirecting non-admins) and uses `useMemo` for filter optimization. All business logic is encapsulated in the container. The presenter is now easily testable with mock data. The utility function for user initials is reusable across the application.
- **Product Lead Note (business value):**  
  Better code organization makes user management features easier to maintain and extend. When developers need to modify user filtering or add new features, they can work on specific parts without affecting the entire page. The reusable utility functions can be used in other parts of the application.

---

## Refactor tickets list page into feature-based structure (2025-11-12)

- **Issue:**  
  The tickets list page (`app/tickets/page.tsx`) was 593 lines, mixing data fetching, complex filtering logic (client-side and server-side), pagination, bulk operations, search, and UI rendering all in one file.
- **Resolution:**  
  Created `features/tickets/` structure and split the tickets list into `TicketsListContainer` (data fetching, filtering, state management) and `TicketsListPresenter` (pure UI). Extracted utility functions and created comprehensive type definitions for all data structures.
- **Before → After:**  
  - Before:  
    Single 593-line file with hooks, complex filtering logic, pagination calculations, bulk operations, search state, and all UI rendering mixed together.  
  - After:  
    `features/tickets/containers/TicketsListContainer.tsx` handles all data fetching, filtering logic (including client-side filtering for resolution time and SLA breach time), pagination, and state management. `features/tickets/presenters/TicketsListPresenter.tsx` is pure UI that receives all data as props. `features/tickets/types/tickets.types.ts` defines all interfaces. `features/tickets/utils/ticket.utils.ts` contains utility functions.  
- **Dev Note (how/why):**  
  The container uses `useMemo` for performance optimization of complex filtering logic. All business logic (client-side filtering, pagination calculations) is encapsulated in the container. The presenter is now easily testable with mock data. The comprehensive type definitions ensure type safety across the feature.
- **Product Lead Note (business value):**  
  The tickets list is one of the most complex pages in the application. Separating the logic from the UI makes it easier to maintain, test, and extend. When developers need to modify ticket filtering or add new features, they can work on specific parts without affecting the entire page.

---

## Refactor all dashboard components into feature-based structure (2025-11-12)

- **Issue:**  
  All dashboard components (`EndUserDashboard`, `ManagerDashboard`, `SupportStaffDashboard`) mixed data fetching, business logic, and UI rendering in single files, making them hard to test and maintain.
- **Resolution:**  
  Created `features/dashboard/` structure and split all three dashboards into Container (data + logic) and Presenter (UI) components. Each dashboard now follows the same pattern as `AdminDashboard`.
- **Before → After:**  
  - Before:  
    Three separate files in `components/pages/` with mixed concerns: `EndUserDashboard.tsx` (158 lines), `ManagerDashboard.tsx` (272 lines), `SupportStaffDashboard.tsx` (255 lines).  
  - After:  
    `features/dashboard/containers/` with three container components handling data fetching and calculations, `features/dashboard/presenters/` with three presenter components for pure UI, and `features/dashboard/types/dashboard.types.ts` with shared type definitions.  
- **Dev Note (how/why):**  
  Applied the container/presenter pattern consistently across all dashboards. Containers use `useMemo` for performance optimization of calculations. Presenters receive all data as props, making them easily testable with mock data. The shared types file ensures consistency across dashboard metrics.
- **Product Lead Note (business value):**  
  Consistent code structure across all dashboards makes the codebase easier to understand and maintain. When developers need to modify dashboard features, they follow the same pattern. This also makes it easier to add new dashboard types or modify existing ones.

---

## Introduce feature-based folder structure with container/presenter split (2025-11-12)

- **Issue:**  
  Components mixed data fetching, business logic, and UI rendering in single files, making them hard to test, reuse, and maintain. The `AdminDashboard` component (277 lines) contained hooks, calculations, and UI all together.
- **Resolution:**  
  Created feature-based folder structure (`features/admin/`) and split `AdminDashboard` into a Container component (data fetching + business logic) and a Presenter component (pure UI). Created type definitions for better type safety.
- **Before → After:**  
  - Before:  
    Single file `components/pages/AdminDashboard.tsx` with everything mixed: hooks (lines 38-69), calculations (lines 84-114), and UI (lines 172-276).  
  - After:  
    `features/admin/containers/AdminDashboardContainer.tsx` handles all data fetching and business logic, `features/admin/presenters/AdminDashboardPresenter.tsx` is pure UI that receives props, and `features/admin/types/admin.types.ts` defines shared types.  
- **Dev Note (how/why):**  
  This is a proof-of-concept for the container/presenter pattern. The container fetches data, calculates metrics using `useMemo`, and passes everything to the presenter as props. The presenter is now testable with mock data and reusable with different data sources. This pattern will be applied to other features incrementally.
- **Product Lead Note (business value):**  
  Better code organization makes the codebase easier to maintain and extend. When developers need to modify admin features, they know exactly where to look (`features/admin/`). The separation of concerns also makes it easier to test and debug issues.

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