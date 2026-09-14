# AppToast

Toast notification overlay (alert, success, error, info types).

**Location:** `frontend/src/components/atoms/AppToast/AppToast.vue`

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `message` | `string` | `""` | Toast text content |
| `type` | `"success"` \| `"error"` \| `"info"` \| `"warning"` | `"info"` | Visual style |
| `duration` | `number` | `3000` | Auto-dismiss milliseconds |

## Slots

- `default` — Custom content (overrides message)

## Emits

| Event | Payload | When |
|---|---|---|
| `close` | — | User clicks dismiss or duration expires |

## Example

```vue
<AppToast 
  type="success" 
  message="App deployed successfully" 
  :duration="4000"
  @close="showToast = false"
/>
```

## Style

- Position: top-right fixed, z-index 1000
- Success: green border + checkmark icon
- Error: red border + X icon
- Info: blue border + info icon
- Auto-dismisses after duration (configurable)
