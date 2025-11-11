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

## Change Title (Date)

- **Issue:**  
- **Resolution:**  
- **Before → After:**  
  - Before:  
  - After:  
- **Dev Note (how/why):**  
- **Product Lead Note (business value):**  

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