# BR-APPS-002: Docker image version immutability

**Domain:** Apps  
**Status:** active

## Rule

Docker image tags are immutable. Once a version is deployed, the image digest is recorded and never re-built under the same tag.

## Enforcement

GitHub Actions CI workflow:
- Builds image with git commit SHA as tag (e.g., `ghcr.io/voikyrioh/app:abc123def`)
- Release tags (semver) are aliases to SHA tags (immutable reference)
- GHCR prevents overwriting tags; re-tag attempts fail

## Implication

- Rollback: switch to previous tag (version history preserved in GitHub releases)
- No "latest" tag in prod (always explicit version)
- No "rebuild from same tag" accidents (image cache never stale)

## Related

INFRA-19 (download MMO, immutable versioning), infra-impact.md (app versioning)
