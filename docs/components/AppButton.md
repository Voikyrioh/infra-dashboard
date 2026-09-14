# AppButton

Primary action button with loading and disabled states.

**Location:** `frontend/src/components/atoms/AppButton/AppButton.vue`

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `variant` | `"primary"` \| `"secondary"` | `"primary"` | Button style |
| `size` | `"sm"` \| `"md"` \| `"lg"` | `"md"` | Padding and font size |
| `disabled` | `boolean` | `false` | Disable interaction |
| `loading` | `boolean` | `false` | Show spinner, disable click |

## Slots

- `default` — Button label text

## Emits

| Event | Payload | When |
|---|---|---|
| `click` | `MouseEvent` | User clicks (if not disabled/loading) |

## Example

```vue
<template>
  <AppButton 
    variant="primary" 
    :disabled="!canSubmit"
    :loading="isSubmitting"
    @click="handleSubmit"
  >
    Submit
  </AppButton>
</template>
```

## Style

- Primary: Emerald background, dark text
- Secondary: Dark border, emerald text
- Hover: Brightness +10%
- Active: Scale 0.98
- Loading: Spinner animation
