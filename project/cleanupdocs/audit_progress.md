# Audit Progress Tracker

This tracker mirrors the items in `audit_findings.md` and records what has been completed during the cleanup effort.

## Legend
- ✅ Completed
- 🚧 In Progress
- ⏳ Not Started

---

## Backend
- ✅ Normalize API response handling for tickets (frontend counterpart complete)
- ✅ Extract workflow orchestration from `TicketsService` into dedicated services
- ✅ Reduce duplicated query logic in `UsersService`
- ✅ Introduce centralized configuration + env validation
- ✅ Address validation/error-handling gaps in DTOs and services
- ✅ Review Prisma schema for indexes & constraints

## Frontend
- ✅ Normalize ticket API responses across hooks and stores
- ✅ Refactor `apiClient` into domain clients + adapters
- ✅ Replace hardcoded admin metrics with data-driven components
- 🚧 Introduce feature-based folder structure with container/presenter split
  - ✅ AdminDashboard (POC)
  - ✅ EndUserDashboard
  - ✅ ManagerDashboard
  - ✅ SupportStaffDashboard
  - ✅ Tickets feature (list page)
  - ✅ Users feature (list page)
- ✅ Improve state management (selectors, shared stores)

## Cross-cutting
- ⏳ Establish shared utilities (formatting, permissions, SLA helpers)
- ⏳ Document schema and refactor plan for Supabase migration

---

Progress is updated after each merged change (see `change_log.md` for detailed entries).

