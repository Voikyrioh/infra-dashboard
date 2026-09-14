# AppRow

Table row component (app name, status badge, tags, actions).

**Location:** `frontend/src/components/molecules/AppRow/AppRow.vue`

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `app` | `{ id, name, status, tags, currentVersion }` | `{}` | App data object |
| `selectable` | `boolean` | `false` | Show checkbox |
| `selected` | `boolean` | `false` | Checkbox state |

## Emits

| Event | Payload | When |
|---|---|---|
| `select` | `boolean` | Checkbox toggled (if selectable) |
| `click-detail` | `string (app.id)` | User clicks row |

## Example

```vue
<AppRow 
  :app="{ id: 'abc', name: 'dofus-api', status: 'running', tags: ['prod'] }"
  @click-detail="navigateToDetail"
/>
```

## Style

- Table-like layout (flex grid)
- Status badge (green "running", red "stopped", yellow "error")
- Tags rendered as TagPill components
- Hover effect (background +2% brightness)
