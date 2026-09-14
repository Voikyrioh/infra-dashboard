# LoginPage

Routed page for authentication (WebAuthn registration/login).

**Location:** `frontend/src/components/pages/LoginPage/LoginPage.vue`

## Route

- Path: `/`
- When: User not authenticated (no JWT cookie)

## Props

- None (routed page, props from route query)

## Data flow

1. Check auth status via `GET /auth/status`
2. If `status: "need-first-auth"`: show registration form (password input)
3. If `status: "need-auth"`: show login form (passkey challenge)
4. On submit: `PUT /auth/` (register) or `POST /auth/verify` (login)
5. On success: redirect to `/dashboard`, set JWT cookie in Pinia store

## Layout

- Full-screen centered card (AuthCard molecule)
- Heading: "Dashboard — Login"
- Forms: password input (registration), WebAuthn button (login)
- Error display (red banner if auth fails)

## Related

ADR-001 (WebAuthn auth flow), open-api/auth.md
