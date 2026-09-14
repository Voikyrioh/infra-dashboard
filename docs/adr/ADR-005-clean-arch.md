# ADR-005: Clean architecture (backend)

**Status:** acceptée

**Context:** Backend API requires separation of concerns: HTTP routing, business logic, data access. Express-style monolithic routes lead to tight coupling and testing difficulty.

**Decision:** Organize backend into layers: `entry-points/` (HTTP concerns), `domain/` (business logic, entities), `data/` (repositories, DAOs), `config/` (environment).

**Consequences:**
- (+) Unit tests isolate business logic from HTTP/database
- (+) Domain entities are database-agnostic (swap PostgreSQL for MySQL easily)
- (+) Clear dependency flow (entry-points → domain → data)
- (-) More files to navigate
- (-) Slight performance overhead from abstraction layers (negligible in admin tool)

**Implementation:**
- Routes in `entry-points/routes/*.ts` → call domain use-cases
- Use-cases in `domain/` → query repositories
- Repositories in `data/repository/` → abstract database access
- DAOs in `data/repository/dao/` → TypeScript type mapping to SQL

**Testing:**
- Unit: mock repositories, test use-case logic
- Integration: test repository queries with real PostgreSQL

**Related:** orga-global ADR-0004 (clean architecture default pattern)
