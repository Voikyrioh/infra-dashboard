# AppInput

Text input field with optional validation error display.

**Location:** `frontend/src/components/atoms/AppInput/AppInput.vue`

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `modelValue` | `string` | `""` | Bound value (v-model) |
| `type` | `"text"` \| `"password"` \| `"email"` | `"text"` | Input type |
| `placeholder` | `string` | `""` | Placeholder text |
| `error` | `string` | `null` | Error message (shows below input) |
| `disabled` | `boolean` | `false` | Disable interaction |

## Emits

| Event | Payload | When |
|---|---|---|
| `update:modelValue` | `string` | User types |
| `focus` | `FocusEvent` | Input receives focus |
| `blur` | `FocusEvent` | Input loses focus |

## Example

```vue
<script setup>
const password = ref("");
const errors = ref("");
</script>

<template>
  <AppInput
    v-model="password"
    type="password"
    placeholder="Min 24 characters"
    :error="errors"
    @blur="validatePassword"
  />
</template>
```

## Style

- Border: Dark gray, 1px
- Focus: Emerald border + glow
- Error: Red border + red text below
- Disabled: Opacity 50%, cursor not-allowed
