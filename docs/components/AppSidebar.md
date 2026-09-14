# AppSidebar

Left navigation sidebar with app list and filters.

**Location:** `frontend/src/components/molecules/AppSidebar/AppSidebar.vue`

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `apps` | `{ id, name, status }[]` | `[]` | App list |
| `activeAppId` | `string` | `""` | Currently selected app |
| `filters` | `{ tags?: string[], status?: string }` | `{}` | Filter state |

## Emits

| Event | Payload | When |
|---|---|---|
| `select-app` | `string (app.id)` | User clicks app |
| `update-filters` | `filters object` | User changes filter |

## Example

```vue
<AppSidebar 
  :apps="appList" 
  :active-app-id="selectedId"
  :filters="{ status: 'running' }"
  @select-app="navigateTo"
/>
```

## Style

- Fixed left sidebar (250px width)
- App list with indentation
- Active app highlighted (emerald border-left)
- Filter pills at bottom
- Scroll if >20 apps
