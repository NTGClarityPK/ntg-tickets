# Codebase Audit & Refactoring Plan

## Backend
### Findings
- **Overloaded services (high):** `TicketsService` mixes validation, workflow orchestration, logging, search indexing, and notification logic (`workflowExecutionService['workflowsService']` pokes into private internals). ```227:284:project/apps/backend/src/modules/tickets/tickets.service.ts```
- **Duplicated query shapes (medium):** `UsersService` repeats identical `include` blocks and pagination math instead of using mappers. ```24:358:project/apps/backend/src/modules/users/users.service.ts```
- **Shared modules leak infrastructure (medium):** `app.module.ts` wires Nest modules directly to env vars, Redis, Prisma, limiting testability and swapability (e.g., Supabase). ```38:88:project/apps/backend/src/app.module.ts```
- **Config drift & hardcoded fallbacks (medium):** Defaults like `'localhost'` for Redis or multiple `.env` paths reduce portability.
- **Validation & error handling gaps (high):** DTOs lean on manual checks; services rethrow raw errors without context.
- **Database schema concerns (medium):** JSON snapshots and free-form status strings complicate constraints; no partial indexes for status-heavy queries.

### Restructuring Plan
- **Folders:** `domain/`, `application/`, `infrastructure/`, `interfaces/`, `shared/`.
- **Utilities:** shared validation, logging, configuration abstractions.
- **Patterns:** Repository + Unit of Work, Command/UseCase, DTO mappers.
- **Modules for reuse:** Auth/RBAC, notification dispatcher, form builder.

---

## Frontend
### Findings
- **Response-shape guessing (high):** Hooks like `useTickets` peel nested `response.data.data.data`, indicating inconsistent contracts. ```16:161:project/apps/frontend/src/hooks/useTickets.ts```
- **Mock metrics (medium):** `AdminDashboard` hardcodes numbers (`failedLogins = 3`) instead of consuming telemetry. ```68:143:project/apps/frontend/src/components/pages/AdminDashboard.tsx```
- **API client bloat (medium):** `apiClient.ts` mixes axios setup, auth refresh, and every route, complicating reuse. ```1:400:project/apps/frontend/src/lib/apiClient.ts```
- **State coupling (medium):** Hooks access `useAuthStore` directly without selectors, causing re-renders.
- **Presentation vs. logic (medium):** Pages combine Mantine UI, data fetching, domain formatting in single files.

### Restructuring Plan
- **Folders:** `features/<domain>` for components/hooks/services, `shared/` for UI primitives, `services/api/` for resource clients, `state/` for stores & query keys.
- **Utilities:** response normalizers, formatting helpers, permission checks.
- **Patterns:** container vs. presenter components, typed adapters wrapping API responses.

---

## Refactoring Roadmap
- **Critical:** stabilize API response adapters; extract workflow orchestration from `TicketsService`.
- **High:** introduce repository interfaces, centralized config, domain-specific API clients.
- **Medium:** deduplicate pagination logic, replace mock dashboard metrics, add validation decorators.
- **Low:** improve logging structure; document schema & add indices.

---

## Phased Approach
1. **Foundation (Week 1–2):** adapters + config schema.
2. **Service Decomposition (Week 3–4):** repositories and use cases for tickets/users.
3. **Frontend Feature Modules (Week 5–6):** relocate logic into feature dirs; refactor hooks.
4. **Shared Utilities & UI (Week 7):** reusable forms, charts, theme tokens.
5. **Supabase Prep (Week 8+):** implement Supabase-ready adapters; align auth flows.
