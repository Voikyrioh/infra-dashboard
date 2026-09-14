# Webhooks endpoints

GitHub integration for CI/CD events.

## POST /webhooks/github

Receive GitHub workflow event (app deployment, release, etc.).

**Request body:**
```json
{
  "repository": { "full_name": "owner/repo", "url": "string" },
  "workflow": "string (workflow name)",
  "status": "success" | "failure",
  "conclusion": "success" | "failure" | "cancelled",
  "head_commit": { "id": "string", "message": "string" }
}
```

**Response:** 200 (event logged)

**Status codes:** 200, 400 (invalid payload), 401 (HMAC signature mismatch), 404 (repo not found)

**Security:** Verify HMAC-SHA256 signature in `X-Hub-Signature-256` header using webhook secret from PostgreSQL.
