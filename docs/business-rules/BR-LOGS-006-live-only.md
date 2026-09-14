# BR-LOGS-006: Container logs are live-only (no persistence)

**Domain:** Logs  
**Status:** active

## Rule

Dashboard streams last 100 lines of container logs live from Docker. No log archival or long-term storage in dashboard database.

## Enforcement

Backend:
- `GET /apps/:id/logs` reads from `docker logs <container>` (Docker socket)
- No INSERT into database for log persistence
- Browser closes stream on page navigate

## Implication

- Container logs lost on container restart (unless captured externally)
- Long-term log aggregation: use SigNoz (Fluent Bit collects to OTLP)
- Live debugging available immediately; historical queries via SigNoz

## Related

ADR-003 (read-only metrics source from Docker), infra-impact.md (observability stack)
