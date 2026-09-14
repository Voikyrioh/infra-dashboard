# AppConfigModal

Modal dialog for viewing/editing app configuration (env vars, volumes, Traefik labels).

**Location:** `frontend/src/components/molecules/AppConfigModal/AppConfigModal.vue`

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `app` | `{ id, name, infraConfig }` | `{}` | App with config |
| `open` | `boolean` | `false` | Modal visibility |
| `editable` | `boolean` | `false` | Allow edit mode (future) |

## Emits

| Event | Payload | When |
|---|---|---|
| `close` | — | User clicks close/X |
| `save` | `{ config object }` | User saves (if editable) |

## Example

```vue
<AppConfigModal 
  :app="selectedApp"
  :open="showConfig"
  @close="showConfig = false"
/>
```

## Style

- Modal overlay (dark background + blur)
- Tabs: Environment, Labels, Volumes
- Code-like monospace font for values
- Close button (X) top-right
