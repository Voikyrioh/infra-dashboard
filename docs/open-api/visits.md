# Visits endpoints

Website analytics from Cloudflare API.

## GET /visits/

Aggregate page views and unique visitors (last 24h).

**Query params:**
- `range`: "24h" | "7d" | "30d" (default: 24h)
- `domain`: "string (optional)"

**Response:**
```json
{
  "timestamp": "ISO 8601",
  "pageviews": number,
  "uniqueVisitors": number,
  "topPages": [
    { "path": "string", "views": number }
  ]
}
```

**Status codes:** 200, 401 (Cloudflare token invalid), 503 (API unavailable)
