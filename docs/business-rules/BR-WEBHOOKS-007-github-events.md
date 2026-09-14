# BR-WEBHOOKS-007: GitHub webhooks for deployment events

**Domain:** Webhooks  
**Status:** active

## Rule

Dashboard receives GitHub workflow events (push, release, deployment status) and logs them. Events are not persisted long-term; they update app version metadata in real-time.

## Enforcement

Backend:
- `POST /webhooks/github` validates HMAC signature (`X-Hub-Signature-256`)
- On success: updates app version in database via `appsRepository.updateVersion()`
- No duplicate event processing (GitHub retries, idempotent upsert)

## Implication

- App version auto-updates when GitHub release is created (no manual sync)
- Webhook secret stored in database (retrieved by secret UUID from GitHub webhook config)
- Failed deliveries retried by GitHub (3-day window)

## Related

ADR-002 (Hono framework for webhook handling), open-api/webhooks.md
