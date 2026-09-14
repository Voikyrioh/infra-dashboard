# ADR-004: PostgreSQL for app registry + auth

**Status:** acceptée

**Context:** Dashboard needs durable storage for: single account record, passkey credentials, app registry (name, tags, metadata), predefined tags. Small dataset (~1000 apps max).

**Decision:** PostgreSQL 18 on shared infra server. Node.js driver: `pg`. Migrations via `db-migrate`.

**Consequences:**
- (+) ACID transactions (passkey write-read consistency)
- (+) Type safety via TypeScript DAOs
- (-) Requires database migration step at deploy
- (-) Network latency (milliseconds, acceptable for admin interface)

**Schema:**
- `accounts`: single record (id=1), owner metadata
- `passkeys`: WebAuthn credential records (CBOR format)
- `apps`: Docker service registry (name, version, tags)
- `app_tags`, `predefined_tags`: relationships

**Related:** orga-global ADR-0001 (PostgreSQL default), infra-impact.md (shared DB on VPS)
