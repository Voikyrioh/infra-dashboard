# Known Issues and Fixes

Track incidents, root causes, and resolutions. Use `FIX:ULID` in ticket title to link to issue.

## Current issues

(None tracked yet — use GitHub Issues labeled `bug` and cross-reference here)

## Past resolutions

(Archive fixed issues here with root cause analysis and prevention measures)

---

**Example format when adding:**

```markdown
## BUG-202609-001: Passkey registration fails on Firefox

**Symptom:** User sees "WebAuthn not supported" on Firefox 120+

**Root cause:** Browser didn't expose `window.PublicKeyCredential` due to
HTTPS requirement (tested on localhost with `--enable-insecure-webauthn`)

**Fix:** Updated dev docs, added HTTPS localhost certificate generation
step in bootstrap

**Prevention:** Run integration tests on Chrome + Firefox CI pipeline
```
