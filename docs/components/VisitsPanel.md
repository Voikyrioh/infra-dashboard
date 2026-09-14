# VisitsPanel

Analytics panel showing website pageviews and unique visitors (Cloudflare API).

**Location:** `frontend/src/components/molecules/VisitsPanel/VisitsPanel.vue`

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `range` | `"24h"` \| `"7d"` \| `"30d"` | `"24h"` | Time window |
| `domain` | `string` | `""` | Domain to query (optional) |
| `loading` | `boolean` | `false` | Loading state |

## Emits

| Event | Payload | When |
|---|---|---|
| `change-range` | `string` | User selects different time range |

## Example

```vue
<VisitsPanel 
  range="24h" 
  domain="voikyrioh.fr"
  :loading="isFetching"
/>
```

## Style

- Panel with metric cards
- Pageviews + Unique Visitors displayed as numbers
- Top pages list (table)
- Range selector tabs (24h, 7d, 30d)
