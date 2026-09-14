# backend — Architecture

## API structure

Hono REST API (Node.js 24) organized by resource routes: `auth/` (WebAuthn flow), `apps/` (CRUD + versioning), `metrics/` (live/history from SigNoz), `tags/` (predefined categories), `visits/` (Cloudflare analytics), `webhooks/` (GitHub integrations).

Each route is a Hono router mounted in `app.ts`. Middleware stack: CORS, logging, error handling. Config loaded via typed environment variables (`config/`), applied at boot.

## Data layer

PostgreSQL via node-postgres with migrations (`db-migrate`). Schema: `accounts` (single owner), `apps` (Docker services), `app_tags` (relationships), `passkeys` (WebAuthn credentials), `predefined_tags` (category enum).

DAOs provide type-safe queries (TypeScript mapped to SQL). Resources wrap DAOs for API-layer validation. Repositories abstract data access (accountsRepository, appsRepository, etc.).

## Authentication flow

First startup: `PUT /auth/` receives password + WebAuthn registration response, creates passkey record in DB.  
Subsequent logins: `GET /auth/challenge` → `POST /auth/verify` (WebAuthn authentication), sets HttpOnly JWT cookie.  
Session check: `GET /auth/status` validates token, returns connection state.
