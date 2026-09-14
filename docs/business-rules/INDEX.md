# Business Rules

Dashboard is a single-owner admin tool for infrastructure management. Limited business logic.

## Core constraints

| Rule | Implication |
|---|---|
| Single owner only | Account table has max 1 record (id=1); PK unique constraint |
| No shared access | No user/team/role model; auth = WebAuthn passkey only |
| Read-only metrics | No manual state changes; Docker Compose is source of truth |
| App registration (manual + sync) | GitHub sync via Actions; manual entry for non-GitHub apps |
| Tag system (optional) | Apps can have 0-N tags for filtering and organization |
| Version immutability | Image tags in GHCR are immutable (Docker best practice) |
| Logs streaming (live only) | No log persistence; Docker logs buffer last 100 lines |

## Enforcement points

- **auth.repository**: `ensureSingleAccount()` checks account count
- **apps.repository**: `findAll()` filters by visibility (future: shared teams)
- **tags.repository**: `findByApp()` LEFT JOIN to handle NULL tags
- **metrics.route**: `GET /metrics/history` queries SigNoz (no local caching)
