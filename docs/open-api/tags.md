# Tags endpoints

Predefined categories for app organization.

## GET /tags/

List all predefined tags.

**Response:**
```json
[
  { "id": "uuid", "name": "string", "color": "hex", "createdAt": "ISO 8601" }
]
```

**Status codes:** 200

---

## POST /tags/

Create new predefined tag.

**Request:**
```json
{
  "name": "string",
  "color": "hex (optional, default: #10b981)"
}
```

**Response:** Created tag object

**Status codes:** 201, 400 (invalid name), 409 (duplicate)
