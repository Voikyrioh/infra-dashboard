# Dashboard Frontend — CLAUDE.md

## Contexte projet
Dashboard d'infrastructure Docker Compose + Traefik. Authentification via WebAuthn/Passkey (Dashlane). Backend Hono (TypeScript) à venir.

## Stack
- Vue 3 (Composition API + `<script setup>`)
- Vue Router 5 (lazy-loaded routes)
- Pinia (stores)
- Tailwind CSS 4 (via @tailwindcss/vite)
- Biome (lint + format, tabs, double quotes)
- Vitest + Vue Test Utils (unit tests)
- Playwright (e2e)

## Structure
```
src/
├── components/
│   ├── atoms/        # Éléments UI de base, toujours réutilisables
│   ├── molecules/    # Combinaisons d'atoms
│   └── pages/        # Vues routées
├── assets/style/     # main.css (global), themes.css (CSS vars)
├── stores/           # Stores Pinia globaux
├── services/         # Appels API (fonction par endpoint)
└── libraries/        # Petites libs maison (webauthn.ts, theme.ts)
```

**Convention co-location** : chaque composant dans son dossier propre avec :
- `ComponentName.vue`
- `ComponentName.spec.ts` (tests unitaires)
- `component.store.ts` si état local (pages uniquement)
- assets spécifiques si nécessaire

Les tests d'intégration et e2e vont dans `src/__tests__/` et `e2e/`.

## Design system

### Polices (Google Fonts, SIL OFL)
- `var(--font-display)` → JetBrains Mono — headings, logo, labels
- `var(--font-body)` → Outfit — corps de texte, boutons

### Thèmes
Géré par `src/libraries/theme.ts` (composable `useTheme()`).
Stocké en `localStorage`, appliqué via `data-theme` sur `<html>`.
Variables CSS dans `src/assets/style/themes.css`.

### Classes globales (`main.css`)
| Classe | Usage |
|---|---|
| `.gradient-bg` | Fond principal + grille décorative |
| `.glass-card` | Carte avec backdrop-blur + border dégradée |
| `.neon-glow-emerald` | box-shadow émeraude |
| `.neon-text-emerald` | text-shadow émeraude |
| `.font-display` | Applique JetBrains Mono |
| `.animate-fade-up` | Entrée animée (0.5s) |
| `.animate-pulse-neon` | Pulsation néon (2s loop) |

### Règle Tailwind vs CSS custom
- Tailwind pour : layout, spacing, flex/grid, responsive
- CSS custom (dans `<style scoped>`) pour : tout ce qui utilise des CSS vars du design system, animations complexes, pseudo-éléments
- Classe globale si le pattern est réutilisé dans 3+ composants

## Auth

### Store global (`src/stores/auth.ts`)
```ts
const auth = useAuthStore()
auth.isAuthenticated  // computed boolean
auth.authKey          // string | null
auth.setAuth(key)
auth.clearAuth()
```

### Guards router
- Non authentifié → `/connexion` automatique
- Authentifié sur `/connexion` → `/dashboard` automatique
- 401 API → `handle401()` dans `src/services/auth.service.ts`

### WebAuthn (`src/libraries/webauthn.ts`)
API native navigateur, pas de dépendance externe.
```ts
createPasskey(options)           // navigator.credentials.create()
authenticateWithPasskey(options) // navigator.credentials.get()
```

## Atoms : règle d'extraction
Extraire en atom dès qu'un élément UI est utilisé dans 2+ endroits différents.
Atoms existants : `AppButton`, `AppInput`.

## Ajouter une feature

1. Créer le dossier dans `atoms/`, `molecules/` ou `pages/`
2. Écrire le `.spec.ts` en premier (TDD si possible)
3. Implémenter le composant
4. Si état global → store dans `src/stores/`
5. Si appel API → fonction dans `src/services/`
6. Ajouter la route dans `src/router/index.ts` avec `meta: { public: true }` si pas d'auth requise

## Scripts
```bash
npm run dev          # Dev server Vite
npm run build        # Build production (esbuild via Vite)
npm run type-check   # vue-tsc (optionnel, pour CI)
npm run test:unit    # Vitest
npm run test:e2e     # Playwright
npm run lint         # Biome lint
npm run format       # Biome format --write
```
