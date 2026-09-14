# Dashboard documentation index

Infrastructure management dashboard: monorepo (backend Hono + frontend Vue 3), WebAuthn auth, real-time Docker metrics, SigNoz integration.

## Layers and domains

| Domain | Architecture | ADRs | Components |
|--------|---|---|---|
| **root** | [ARCHITECTURE.md](../ARCHITECTURE.md) | [stack, auth strategy, design system](./adr/) | - |
| **backend** | [backend/ARCHITECTURE.md](../backend/ARCHITECTURE.md) | [clean architecture, ORM choice, Hono](./adr/) | [API endpoints](./open-api/) |
| **frontend** | [frontend/ARCHITECTURE.md](../frontend/ARCHITECTURE.md) | [state management, component hierarchy, Tailwind](./adr/) | [Vue components](./components/) |

## Documentation by type

- **[Architecture Decisions (ADR)](./adr/)** — Framework choices, auth pattern, deployment strategy
- **[Business Rules](./business-rules/)** — Single-owner constraint, app lifecycle, visibility rules
- **[Known Issues and Fixes](./bugs/)** — Track incidents and resolutions
- **[API Reference](./open-api/)** — Endpoint contracts, schemas, examples
- **[Components](./components/)** — Vue component specs (props, events, behavior)

## Getting started

1. Read [ARCHITECTURE.md](../ARCHITECTURE.md) for system overview
2. Understand authentication: [ADR-001-webauthn](./adr/ADR-001-webauthn.md)
3. Backend development: [backend/ARCHITECTURE.md](../backend/ARCHITECTURE.md) + [open-api/auth.md](./open-api/auth.md)
4. Frontend development: [frontend/ARCHITECTURE.md](../frontend/ARCHITECTURE.md) + [components/](./components/)

## Key decisions

- **WebAuthn (passkeys)** for biometric auth — no passwords stored
- **PostgreSQL** for single-owner account + app registry
- **Hono** minimal REST API framework
- **Vue 3 composition API** with Pinia for state
- **Tailwind CSS 4** with dark-mode CSS variables
- **Docker socket access** for live metrics (production only)
- **SigNoz query API** for historical metrics and alerts
