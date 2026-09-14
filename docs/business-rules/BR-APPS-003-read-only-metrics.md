# BR-APPS-003: Read-only metrics (Docker Compose source of truth)

**Domain:** Apps  
**Status:** active

## Rule

Dashboard displays metrics from Docker Compose and SigNoz. No manual state changes are persisted; Docker Compose `docker-compose.yml` is the single source of truth.

## Enforcement

Backend API:
- `GET /apps/:id/stats` reads live from Docker socket (read-only)
- `PUT /apps/:id` allows metadata updates (tags, custom fields) only, not image/version
- Version changes via GitHub release (CI/CD), not manual API

## Implication

- No direct container restart/scaling from dashboard (future feature)
- Audit trail lives in GitHub Actions logs + Docker container logs
- Metrics are point-in-time (no long-term storage in dashboard DB)

## Related

ADR-003 (metrics sourced from SigNoz), infra-impact.md (Traefik labels)
