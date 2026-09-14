# dashboard — Architecture

## Monorepo structure

Dashboard application for infrastructure management across all products. Dual-stack SPA: Hono/TypeScript backend API + Vue 3 frontend. Single-owner authentication via WebAuthn/Passkeys (biometric). Real-time metrics collection from Docker, SigNoz observability backend integration.

Core directories: `backend/` (API server, auth, database access), `frontend/` (Vue SPA, stores, UI components), `docs/` (specs, decisions, API reference).

## Backend design

REST API (Hono framework) using clean architecture layers: `entry-points/` (routes/middleware), `domain/` (entities/use-cases), `data/` (repositories, database resources), `config/` (typed environment variables).

Authentication: WebAuthn registration/verification via `@simplewebauthn` library, JWT stored in HttpOnly cookies. Database: PostgreSQL with typed DAOs and migrations via `db-migrate`.

## Frontend design

Vue 3 SPA with composition API, Pinia stores (auth state), Vue Router navigation. Atomic component hierarchy: atoms (AppButton, AppInput, gauges) → molecules (cards, modals, sidebars) → pages (Login, Dashboard, AppDetail). Design system: dark theme with emerald accents, glass-morphism cards, CSS variables for theming.

## External integrations

GitHub API (PAT): app detection, version polling, GHCR image tags. SigNoz query API: historical metrics and alert data. Docker socket (backend production): live container stats via `docker-compose ps` and socket bindings.
