# ADR-001: WebAuthn (passkeys) for authentication

**Status:** acceptée

**Context:** Dashboard requires secure single-owner authentication. Traditional username/password auth creates risk of credential theft. Owner uses Dashlane password manager with biometric unlock, enabling FIDO2 security key support.

**Decision:** Implement WebAuthn (FIDO2) passkey registration and authentication. No password storage; owner authenticates via biometric or security key only.

**Consequences:**
- (+) Biometric + security key support, phishing-resistant, no password risk
- (+) Modern browser support (Chrome, Firefox, Safari all support WebAuthn)
- (+) Owner experience: Dashlane unlocks passkey automatically
- (-) Requires `@simplewebauthn` library (5KB gzipped)
- (-) E2E tests need Chromium virtual authenticator (CDP API)
- (-) Registration only works over HTTPS (Chromium allows localhost for dev)

**Implementation:**
- Backend: Hono routes handle registration challenge + response, passkey storage in PostgreSQL
- Frontend: `webauthn.ts` service wraps navigator.credentials API
- Tests: Playwright e2e with `WebAuthn.addVirtualAuthenticator` CDP extension

**Related:** orga-global ADR-0002 (WebAuthn pattern for Voiky ecosystem)
