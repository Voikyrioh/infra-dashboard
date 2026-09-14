# ADR-002: Hono for REST API

**Status:** acceptée

**Context:** Dashboard backend needs minimal, type-safe REST API. Options: Express (bloated), Fastify (complex), Hono (lightweight, modern).

**Decision:** Use Hono (TypeScript-first, ~50KB, Cloudflare Workers compatible, zero-dependency middleware stack).

**Consequences:**
- (+) Type safety via Hono schema validation
- (+) Built-in middleware for CORS, logging, errors
- (+) Tiny bundle (potential edge-compute future)
- (+) Modern async/await API (no callback hell)
- (-) Smaller ecosystem than Express
- (-) No built-in OpenAPI auto-generation

**Implementation:**
- Routes organized by resource (auth.ts, apps.ts, metrics.ts, etc.)
- Middleware stack: CORS → logging → error handler
- Config injected at app boot via typed env variables

**Related:** orga-global ADR-0001 (Node.js 20+ default)
