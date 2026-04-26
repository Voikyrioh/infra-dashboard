# Dashboard — CLAUDE.md

## Contexte projet

Dashboard d'infrastructure pour gérer des déploiements Docker Compose + Traefik.  
Authentification via WebAuthn/Passkey (Dashlane). Un seul owner, accès privé.

## Structure du monorepo

```
dashboard/
├── backend/    # API Hono (TypeScript, Node.js)
└── frontend/   # Vue 3 + Vite
```

Voir les CLAUDE.md de chaque partie pour les détails d'architecture.

## URLs par défaut (dev)

| Service  | URL                          |
|----------|------------------------------|
| Backend  | http://localhost:3000        |
| Frontend | http://localhost:5173        |
| API base | http://localhost:3000/api/v1 |

## Commandes dev

```bash
# Backend
cd backend && npm run dev

# Frontend
cd frontend && npm run dev

# Les deux simultanément (depuis la racine)
npm run dev --workspace=backend &
npm run dev --workspace=frontend
```

## Auth flow (premier démarrage)

1. `GET /api/v1/auth/status` → `{ status: "need-first-auth", passkeyOptions: {...} }`
2. L'utilisateur saisit le mot de passe d'initialisation (`INIT_PASSWORD`, min 24 chars)
3. Le navigateur crée une passkey via WebAuthn avec les `passkeyOptions`
4. `PUT /api/v1/auth/` → `{ password, registrationResponse }` → `{ token }`
5. Le token JWT (HS256) est stocké en mémoire (Pinia `auth.authKey`)

## Variables d'environnement clés (backend)

| Variable              | Description                        | Dev default     |
|-----------------------|------------------------------------|-----------------|
| `INIT_PASSWORD`       | Mot de passe de création initiale  | `test222&&`     |
| `PRIVATE_KEY`         | Secret HMAC pour JWT               | `./.ssl/id_rsa` |
| `JWT_EXPIRATION_TIME_MS` | Durée du token en ms           | `3600000` (1h)  |
| `PORT`                | Port du serveur                    | `3000`          |
| `PG_HOST/USER/PASSWORD/DATABASE` | Postgres      | `localhost/user/password/dashboard` |
