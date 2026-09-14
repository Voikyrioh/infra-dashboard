# Auth endpoints

WebAuthn-based authentication: registration (first-time setup) and login (passkey verification).

## GET /auth/status

Current session status.

**Request:** None (uses JWT cookie)

**Response:**
```json
{
  "status": "connected" | "need-auth" | "need-first-auth",
  "passkeyOptions?: { challenge, rp, user, ... }"
}
```

**Status codes:** 200

---

## PUT /auth/

Register passkey (first-time setup only) or update credentials.

**Request:**
```json
{
  "password": "string (min 24 chars)",
  "registrationResponse": { WebAuthn RegistrationResponse }
}
```

**Response:** Sets HttpOnly JWT cookie, returns 200

**Status codes:** 200, 400 (invalid password/response), 409 (already registered)

---

## GET /auth/challenge

Generate WebAuthn challenge for login.

**Request:** None

**Response:**
```json
{
  "options": { PublicKeyCredentialRequestOptions }
}
```

**Status codes:** 200, 503 (if need-first-auth)

---

## POST /auth/verify

Verify WebAuthn authentication response.

**Request:**
```json
{
  "authenticationResponse": { WebAuthn AuthenticationResponse }
}
```

**Response:** Sets HttpOnly JWT cookie, returns 200

**Status codes:** 200, 401 (invalid response), 409 (no passkey registered)

---

## DELETE /auth/

Logout — invalidate session.

**Request:** None

**Response:** Clears JWT cookie

**Status codes:** 200
