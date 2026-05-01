# [dashboard]

Dashboard d'infrastructure personnel pour gérer des déploiements Docker Compose + Traefik sur un VPS.  
Authentification par passkey (WebAuthn/FIDO2) — aucun mot de passe stocké, un seul owner.

---

## Stack

| Couche | Technologie |
|---|---|
| **Frontend** | Vue 3 · Vite 8 · Pinia · Vue Router 5 · Tailwind CSS 4 |
| **Backend** | Hono · Node.js 24 · TypeScript |
| **Base de données** | PostgreSQL 18 |
| **Auth** | WebAuthn/Passkey via `@simplewebauthn` · JWT cookie HttpOnly |
| **Infra** | Docker Compose · Traefik · Cloudflare · GHCR |
| **CI/CD** | GitHub Actions → GHCR → VPS via SSH |
| **Tests** | Vitest (unit) · Playwright (e2e) · Mocha + Chai (backend) |
| **Qualité** | Biome (lint + format) |

---

## Structure

```
dashboard/
├── backend/              # API Hono (TypeScript)
│   ├── src/
│   │   ├── config/       # Variables d'environnement typées
│   │   ├── data/         # Accès DB (resources, repositories, DAOs)
│   │   ├── domain/       # Entités, use-cases
│   │   └── entry-points/ # Routes Hono, app bootstrap
│   └── migrations/       # Migrations db-migrate
├── frontend/             # Vue 3 SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── atoms/    # AppButton, AppInput
│   │   │   ├── molecules/# AuthCard, AppSidebar
│   │   │   └── pages/    # LoginPage, DashboardPage
│   │   ├── stores/       # Pinia (auth)
│   │   ├── services/     # Appels API
│   │   ├── libraries/    # webauthn.ts, theme.ts
│   │   └── assets/style/ # Design system (CSS vars, thèmes)
│   └── e2e/              # Tests Playwright
├── docs/
│   └── superpowers/      # Specs et plans d'implémentation
├── docker-compose.yml    # Production
└── docker-compose.dev.yml# Développement local (containers)
```

---

## Démarrage rapide

### Prérequis

- Node.js ≥ 24
- Docker Desktop
- PostgreSQL (ou via Docker)

### 1. Variables d'environnement

```bash
# env/pg.env
POSTGRES_USER=user
POSTGRES_PASSWORD=password
POSTGRES_DB=dashboard
PGHOST=localhost

# env/.env
INIT_PASSWORD=<mot-de-passe-min-24-caractères>
PRIVATE_KEY=./.ssl/id_rsa
JWT_EXPIRATION_TIME_MS=3600000
RP_ID=localhost
ORIGIN=http://localhost:5173
```

Générer la clé RSA pour le JWT :

```bash
cd backend && npm run generate-key
```

### 2. Base de données

```bash
# Démarrer PostgreSQL
docker compose -f docker-compose.dev.yml up database -d

# Appliquer les migrations
cd backend && npm run migrate:db
```

### 3. Dev servers

```bash
# Backend (port 3000)
cd backend && npm run dev

# Frontend (port 5173, proxy /api → :3000)
cd frontend && npm run dev
```

Ou avec Docker (tout en un) :

```bash
docker compose -f docker-compose.dev.yml up --build
```

---

## Auth flow

L'application supporte un seul owner. L'authentification se fait exclusivement par passkey (biométrie, clé de sécurité…).

```
Premier démarrage
─────────────────
GET  /api/v1/auth/status  →  { status: "need-first-auth", passkeyOptions: {...} }
PUT  /api/v1/auth/        ←  { password, registrationResponse }
                          →  Cookie JWT posé (HttpOnly · Secure · SameSite=Strict)

Connexion suivante
──────────────────
GET  /api/v1/auth/status  →  { status: "need-auth" }
GET  /api/v1/auth/challenge →  PublicKeyCredentialRequestOptions
POST /api/v1/auth/verify  ←  { authenticationResponse }
                          →  Cookie JWT posé

Session active
──────────────
GET  /api/v1/auth/status  →  { status: "connected" }
DELETE /api/v1/auth/      →  Cookie supprimé (logout)
```

Le token JWT n'est jamais exposé côté JavaScript — seul le cookie de session est utilisé.

---

## API

Base URL : `http://localhost:3000/api/v1`

| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/auth/status` | Statut de session (`connected` / `need-auth` / `need-first-auth`) |
| `PUT` | `/auth/` | Création du compte + enregistrement passkey (first-time setup) |
| `DELETE` | `/auth/` | Logout — supprime le cookie de session |
| `GET` | `/auth/challenge` | Génère un challenge WebAuthn pour l'authentification |
| `POST` | `/auth/verify` | Vérifie la réponse WebAuthn et pose le cookie JWT |

---

## Tests

```bash
# Backend (Mocha + Chai)
cd backend && npm test

# Frontend unitaires (Vitest)
cd frontend && npm run test:unit

# E2E (Playwright, Chromium requis pour WebAuthn virtuel)
cd frontend && npm run test:e2e
```

Les tests E2E utilisent l'API CDP `WebAuthn.addVirtualAuthenticator` de Chromium pour simuler une passkey sans interaction humaine.

---

## Design system

Le frontend utilise un design system dark/emerald custom sans composant UI tiers.

- **Palette** : fond `#0a0e17` · accent émeraude `#10b981` · bleu navy `#1d4ed8`
- **Polices** : JetBrains Mono (display) · Outfit (corps)
- **Composants** : glass cards avec `backdrop-filter: blur`, effets neon sur les accents
- **Thème** : dark/light via `data-theme` sur `<html>`, persisté en `localStorage`

---

## CI/CD

Le pipeline GitHub Actions publie les images Docker sur GHCR et déploie sur le VPS via SSH à chaque push sur `main` (si les fichiers du service concerné ont changé).

```
push → main
  ├── frontend/** → build image → ghcr.io/voikyrioh/dashboard-frontend
  │                             → docker compose up dashboard-ui (VPS)
  └── (backend à venir)
```

Images : `ghcr.io/voikyrioh/dashboard-frontend` · `ghcr.io/voikyrioh/dashboard-api`

---

## Production

Le service est exposé sur `dashboard.voikyrioh.fr` via Traefik avec TLS automatique (Cloudflare DNS challenge).  
Le backend tourne dans un réseau Docker interne (`dashboard`) sans exposition directe.

```bash
# Déploiement manuel
IMAGE_TAG=<sha> docker compose up -d
```

---

## Roadmap

- [x] Auth WebAuthn complète (setup + login + logout)
- [x] Cookie de session HttpOnly
- [ ] **DASH-3/4** — Métriques serveur (CPU, RAM, réseau via Docker socket + historique Victoria Metrics)
- [ ] **DASH-4** — Visites uniques (Cloudflare API global + Loki/Traefik par app)
- [ ] **DASH-5/6** — Dashboard métriques temps réel + graphes
- [ ] **DASH-7/8** — Base de données d'applications (détection via GitHub Actions workflow réutilisable)
- [ ] **DASH-9/10** — Liste des applications avec état
- [ ] **DASH-11/12/13** — Détail app (métriques container, logs, déploiements)
- [ ] **DASH-14/15/16/17** — Déploiement manuel + gestion env vars
