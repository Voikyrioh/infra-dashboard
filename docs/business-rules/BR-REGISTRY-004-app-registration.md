# BR-REGISTRY-004: App registration (manual + GitHub sync)

**Domain:** Registry  
**Status:** active

## Rule

Applications are registered in two ways: (a) automatic GitHub Actions discovery via workflow outputs, (b) manual entry for non-GitHub services.

## Enforcement

Backend:
- `POST /apps/sync` queries GitHub API (GITHUB_TOKEN scope: `repo` + `read:packages`)
- `POST /apps/` allows manual creation with repo URL validation
- Database uniqueness constraint on (name, repo) pair

## Implication

- Dashboard discovers apps automatically (minimal config)
- Non-GitHub services (Docker Hub, private registry) registered manually
- Sync is idempotent (re-running sync doesn't duplicate apps)

## Related

ADR-002 (Hono framework for flexible API), README.md (GITHUB_TOKEN setup)
