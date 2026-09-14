# TagPill

Label badge component with optional remove button (tag display/management).

**Location:** `frontend/src/components/atoms/TagPill/TagPill.vue`

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `label` | `string` | `""` | Tag text |
| `color` | `string (hex)` | `"#10b981"` | Background color |
| `removable` | `boolean` | `false` | Show X button |

## Emits

| Event | Payload | When |
|---|---|---|
| `remove` | — | User clicks X (if removable) |

## Example

```vue
<TagPill label="Production" color="#ef4444" :removable="true" @remove="removeTag" />
```

## Style

- Rounded pill background
- Text color auto-contrast (white/dark based on bg)
- Hover: brightness +5%
- X icon on right (if removable)
