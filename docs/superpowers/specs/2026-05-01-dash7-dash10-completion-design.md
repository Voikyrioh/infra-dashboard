# Feature 2 — Complétion DASH-7 à DASH-10

## Contexte

Ce document complète le spec initial du 2026-04-28 (`2026-04-28-dash7-dash10-apps-db-design.md`).
Le backend (use-cases, routes, DB) et la page Applications sont largement implémentés. Il reste trois éléments non réalisés :

1. **Workflow réutilisable** — `.github/workflows/build-deploy.yml` à créer dans le dashboard repo
2. **Template appelant** — `examples/build-deploy.yml` à réécrire comme thin caller
3. **Navigation sidebar** — remplace l'`AppHeader` par une sidebar icônes + tooltip

---

## DASH-7/8 — Workflow réutilisable

### Fichier dashboard : `.github/workflows/build-deploy.yml`

Workflow réutilisable (`on: workflow_call`). Reprend les 3 jobs du template standalone actuel.

**Inputs :**

| Input | Type | Required | Description |
|---|---|---|---|
| `app-name` | string | ✅ | Nom de l'app (ex: `my-frontend`) — utilisé pour le tag Docker et le path SSH |
| `tag` | string | ✅ | Version tag (ex: `v1.0.0`) |

**Secrets :**

| Secret | Required | Description |
|---|---|---|
| `SSH_PRIVATE_KEY` | ✅ | Clé SSH privée |
| `SSH_HOST` | ✅ | Hôte du VPS |
| `SSH_PORT` | ✅ | Port SSH |
| `SSH_USER` | ✅ | Utilisateur SSH |
| `SSH_HOST_FINGERPRINT` | ✅ | Empreinte SSH du VPS |

**Jobs (ordre) :**
1. `create_release` — crée la GitHub release avec `gh release create`
2. `publish_image` — build + push image sur GHCR avec tag `ghcr.io/{owner}/{app-name}:{tag}` et `latest`
3. `deploy` — SSH vers le VPS, met à jour `IMAGE_TAG` dans `.env`, `docker compose pull && up -d`

### Fichier exemple : `examples/build-deploy.yml`

Template thin caller que chaque app copie et adapte (seule modification : `app-name`).

```yaml
name: Build & Deploy

on:
  workflow_dispatch:
    inputs:
      tag:
        description: "Version tag (ex: v1.0.0)"
        required: true

jobs:
  deploy:
    uses: voikyrioh/dashboard/.github/workflows/build-deploy.yml@main
    with:
      app-name: <nom-de-l-app>   # ← seule ligne à changer
      tag: ${{ inputs.tag }}
    secrets: inherit
```

### Filtre repo dashboard dans la détection

`github-search.service.ts` — après avoir récupéré les résultats, exclure le repo dont le nom est `dashboard` (le repo dashboard lui-même contient le fichier et serait sinon détecté comme une "app").

```ts
return data.items
  .filter((item) => item.repository.name !== 'dashboard')
  .map((item) => ({ repoName: item.repository.name, repoUrl: item.repository.html_url }))
```

---

## DASH-10 — Navigation sidebar

### Remplacement du layout global

`App.vue` remplace le layout `AppHeader + <RouterView>` par `AppSidebar + <RouterView>` dans un flex horizontal plein écran.

```html
<div class="app-layout">
  <AppSidebar />
  <main class="app-layout__content">
    <RouterView />
  </main>
</div>
```

```css
.app-layout {
  display: flex;
  min-height: 100vh;
}
.app-layout__content {
  flex: 1;
  overflow-y: auto;
}
```

### Composant `AppSidebar` (molecule)

Remplace `AppHeader`. Fichiers : `src/components/molecules/AppSidebar/AppSidebar.vue`.

**Structure verticale :**

| Zone | Contenu |
|---|---|
| Haut | Logo `[d]` (RouterLink vers `/dashboard`) |
| Milieu | Icône Dashboard · Icône Applications |
| Bas | Bouton theme toggle · Bouton déconnexion |

**Comportement :**
- **Largeur fixe** : 56px
- **Icône active** : fond `rgba(52,211,153,0.15)` + bordure `rgba(52,211,153,0.4)` + couleur émeraude
- **Icône inactive** : transparent, couleur `rgba(255,255,255,0.35)`
- **Hover inactif** : fond `rgba(255,255,255,0.05)` + couleur `rgba(255,255,255,0.6)`
- **Tooltip** : attribut `title` natif HTML (pas de lib externe)
- **RouterLink actif** : classe `router-link-active` → applique le style actif via CSS

**Icônes (SVG inline, 16×16, stroke) :**
- Dashboard : grille 2×2 (4 rectangles)
- Applications : cube/box (hexagone 3D)
- Theme : soleil (dark) / lune (light)
- Logout : porte avec flèche

### `AppHeader` — suppression

`AppHeader.vue` devient inutilisé. Le fichier est supprimé, les imports retirés de `App.vue`.

### Routes

Aucune modification de `router/index.ts` — `/applications` est déjà déclarée et protégée.

---

## Variables d'environnement (rappel)

| Variable | Dev default | Notes |
|---|---|---|
| `GITHUB_TOKEN` | — | PAT GitHub, scope `repo` lecture |
| `GITHUB_OWNER` | `voikyrioh` | Username GitHub de l'owner |

`Config.Server.GitHubToken` et `Config.Server.GitHubOwner` sont déjà dans le config backend.

---

## Flux de détection (récapitulatif)

```
App repo : .github/workflows/build-deploy.yml
  → uses: voikyrioh/dashboard/.github/workflows/build-deploy.yml@main

Dashboard sync :
  POST /api/v1/apps/sync
    → GitHub Code Search : "voikyrioh/dashboard/.github/workflows/build-deploy.yml in:file"
    → Filtre repo "dashboard"
    → Upsert dans apps (repo_name, repo_url, last_synced_at)
```
