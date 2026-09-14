# VersionSelect

Dropdown select for app version selection (with recent versions list).

**Location:** `frontend/src/components/atoms/VersionSelect/VersionSelect.vue`

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `modelValue` | `string` | `""` | Selected version tag |
| `options` | `{ tag: string, createdAt: string }[]` | `[]` | Available versions from GHCR |

## Emits

| Event | Payload | When |
|---|---|---|
| `update:modelValue` | `string` | User selects version |

## Example

```vue
<VersionSelect 
  v-model="selectedVersion" 
  :options="versions"
/>
```

## Style

- Custom dropdown (not `<select>` for styling control)
- Shows tag + date created
- Highlights current version
- Scroll if >10 versions
