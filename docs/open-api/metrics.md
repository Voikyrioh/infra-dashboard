# Metrics endpoints

Real-time and historical metrics from SigNoz (or Docker for live data).

## GET /metrics/live

Aggregate system metrics (all apps + host).

**Response:**
```json
{
  "timestamp": "ISO 8601",
  "host": {
    "cpu": number (percent),
    "memory": number (bytes),
    "disk": number (percent)
  },
  "apps": [
    { "name": "string", "cpu": number, "memory": number }
  ]
}
```

**Status codes:** 200, 503 (SigNoz unavailable)

---

## GET /metrics/history

Historical metrics from SigNoz (last 24h, 7d, 30d).

**Query params:**
- `range`: "24h" | "7d" | "30d" (default: 24h)
- `app`: "string (optional - filter by app)"

**Response:**
```json
[
  {
    "timestamp": "ISO 8601",
    "app": "string",
    "cpu": number,
    "memory": number,
    "network": { "rx": number, "tx": number }
  }
]
```

**Status codes:** 200, 400 (invalid range), 503 (SigNoz unavailable)
