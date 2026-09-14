# API Reference

Dashboard backend REST API (Hono). Base URL: `http://localhost:3000/api/v1`

## Endpoints by resource

| Resource | Endpoints | Methods |
|---|---|---|
| [Auth](./auth.md) | `/auth/status`, `/auth/`, `/auth/challenge`, `/auth/verify` | GET, PUT, DELETE, POST |
| [Apps](./apps.md) | `/apps/`, `/apps/:id`, `/apps/sync`, `/apps/:id/versions`, `/apps/:id/stats`, `/apps/:id/infra-config`, `/apps/:id/logs` | GET, POST, PUT |
| [Metrics](./metrics.md) | `/metrics/live`, `/metrics/history` | GET |
| [Tags](./tags.md) | `/tags/` | GET, POST |
| [Visits](./visits.md) | `/visits/` | GET |
| [Webhooks](./webhooks.md) | `/webhooks/github` | POST |

## Total: 22 endpoints across 6 resources

**Authentication:** All endpoints except `/auth/` require JWT cookie (HttpOnly). Verified by middleware; 401 if missing/invalid.

**Error format:** `{ error: string, details?: object }`

**Timestamps:** ISO 8601 format (UTC)
