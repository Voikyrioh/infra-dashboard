# AuthCard

Login/registration card wrapper with WebAuthn passkey integration.

**Location:** `frontend/src/components/molecules/AuthCard/AuthCard.vue`

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `status` | `"login"` \| `"register"` \| `"loading"` | `"login"` | Card state |
| `error` | `string` | `""` | Error message (shows red) |

## Slots

- `header` — Title text
- `content` — Form fields (inputs, buttons)
- `footer` — Footer text (ToS, etc.)

## Emits

| Event | Payload | When |
|---|---|---|
| `authenticate` | `{ registrationResponse \| authenticationResponse }` | User submits form |

## Example

```vue
<AuthCard status="login" :error="loginError">
  <template #header>Login</template>
  <template #content>
    <AppInput v-model="password" type="password" />
    <AppButton @click="authenticate">Sign In</AppButton>
  </template>
</AuthCard>
```

## Style

- Glass-morphism card (frosted background + blur)
- Center-screen responsive layout
- Loading spinner overlay (status="loading")
- Error message red border
