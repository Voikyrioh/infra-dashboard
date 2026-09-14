# Apps endpoints

Docker Compose service registry and deployment management.

## POST /apps/sync

Sync apps from GitHub workflow (auto-detect via Actions). Calls GitHub API to discover repos.

**Request:** None

**Response:**
```json
{ "synced": number, "added": number, "updated": number }
```

**Status codes:** 200, 500 (GitHub API error)

---

## GET /apps/

List all registered applications.

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "string",
    "repo": "owner/repo",
    "currentVersion": "string",
    "status": "running" | "stopped" | "error",
    "tags": ["string"],
    "createdAt": "ISO 8601"
  }
]
```

**Status codes:** 200

---

## POST /apps/

Create new app (manual registration).

**Request:**
```json
{
  "name": "string",
  "repo": "owner/repo",
  "imageTag": "string",
  "tags": ["string"]
}
```

**Response:** Created app object

**Status codes:** 201, 400 (duplicate), 409 (repo not found)

---

## GET /apps/:id

Fetch single app details.

**Response:** App object (expanded with logs, metrics)

**Status codes:** 200, 404

---

## PUT /apps/:id

Update app metadata or redeploy.

**Request:**
```json
{
  "tags": ["string"],
  "imageTag": "string (for redeploy)"
}
```

**Response:** Updated app object

**Status codes:** 200, 404

---

## GET /apps/:id/versions

List available image versions from GHCR.

**Response:**
```json
[
  { "tag": "string", "createdAt": "ISO 8601", "digest": "string" }
]
```

**Status codes:** 200, 404, 500 (GHCR API error)

---

## GET /apps/:id/stats

Live container metrics (CPU, memory, network).

**Response:**
```json
{
  "cpu": number (percent),
  "memory": number (percent),
  "network": { "rx": number (bytes), "tx": number (bytes) }
}
```

**Status codes:** 200, 404, 503 (Docker socket unavailable)

---

## GET /apps/:id/infra-config

Infrastructure configuration (Traefik labels, env vars, mounts).

**Response:**
```json
{
  "labels": { "traefik.*": "string" },
  "environment": ["KEY=value"],
  "volumes": ["mount:path:ro"]
}
```

**Status codes:** 200, 404

---

## GET /apps/:id/logs

Container logs (last 100 lines, follow mode).

**Response:** 
```
text/plain stream or JSON array (if non-streaming)
```

**Status codes:** 200, 404, 503
