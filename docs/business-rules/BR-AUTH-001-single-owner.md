# BR-AUTH-001: Single owner constraint

**Domain:** Authentication  
**Status:** active

## Rule

Dashboard accepts only one owner account. At any time, the `accounts` table contains exactly one record (id=1). No multi-user support.

## Enforcement

Application layer (backend):
- `accounts.repository.ts`: `ensureSingleAccount()` on startup, throws if `COUNT(*) > 1`
- Database layer: `UNIQUE constraint on id` (prevents duplicate primary key)
- UI: Login screen has no user selection; always authenticates against account id=1

## Implication

- No team collaboration
- No role-based access control
- No audit log of which "user" made changes (single actor implicitly)
- Passkey registration only works if no passkey exists (first-time setup assumption)

## Related

ADR-001 (WebAuthn single owner design)
