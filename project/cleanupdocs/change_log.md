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