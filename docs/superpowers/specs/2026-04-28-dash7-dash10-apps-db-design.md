# Feature 2 — Base de données d'applications (DASH-7 à DASH-10)

## Contexte

Le dashboard doit lister les applications déployées via le workflow réutilisable GitHub `voikyrioh/dashboard/.github/workflows/build-deploy.yml@main`. Cette feature couvre la détection automatique des apps depuis GitHub, leur stockage en base, leur configuration manuelle, et leur affichage sur une page dédiée.

---

## DASH-9 — Schéma DB

### Table `apps`

| Colonne | Type | Notes |
|---|---|---|
| `id` | UUID PK | `uuidv7()` |
| `repo_name` | VARCHAR NOT NULL | Nom du repo GitHub (ex: `my-frontend`) |
| `repo_url` | VARCHAR NOT NULL | URL complète du repo |
| `display_name` | VARCHAR nullable | Nom d'affichage. `null` = app non configurée |
| `type` | VARCHAR nullable | `'frontend'` \| `'backend'` \| `'fullstack'` |
| `container_name` | VARCHAR nullable | Nom du container Docker associé |
| `configured` | BOOLEAN | `false` par défaut |
| `last_synced_at` | TIMESTAMPTZ | Date du dernier sync GitHub |
| `created_at` | TIMESTAMPTZ | `now()` |
| `updated_at` | TIMESTAMPTZ | `now()` |

### Table `predefined_tags`

| Colonne | Type | Notes |
|---|---|---|
| `id` | UUID PK | `uuidv7()` |
| `category` | VARCHAR NOT NULL | Ex: `'database'`, `'runtime'` |
| `label` | VARCHAR NOT NULL | Ex: `'PostgreSQL'`, `'Redis'` |
| `color` | VARCHAR NOT NULL | Couleur hex pour l'affichage |

**Données initiales à la migration :**
| category | label | color |
|---|---|---|
| database | PostgreSQL | #336791 |
| database | Redis | #DC382D |
| database | MongoDB | #47A248 |
| database | MySQL | #4479A1 |
| database | SQLite | #003B57 |

### Table `app_tags`

| Colonne | Type | Notes |
|---|---|---|
| `app_id` | UUID FK → apps.id | CASCADE DELETE |
| `tag_id` | UUID FK → predefined_tags.id | CASCADE DELETE |
| PK composite | `(app_id, tag_id)` | Pas de doublon |

---

## DASH-7/8 — Backend : Synchronisation GitHub

### Variables d'environnement

| Variable | Description | Dev default |
|---|---|---|
| `GITHUB_TOKEN` | Personal Access Token (scope `repo` lecture) | — |
| `GITHUB_OWNER` | Username GitHub | `voikyrioh` |

### Détection des apps

Utilisation de la **GitHub Code Search API** pour trouver les repos référençant le workflow réutilisable :

```
GET https://api.github.com/search/code?q=voikyrioh/dashboard/.github/workflows/build-deploy.yml+in:file
Authorization: Bearer {GITHUB_TOKEN}
```

Une seule requête, pas de scan exhaustif de tous les repos. L'API retourne des résultats de fichiers — on en extrait le repo owner/name pour upsert dans `apps`.

**Comportement de l'upsert :** si le repo existe déjà en base (`repo_name` unique), seul `last_synced_at` est mis à jour. Les champs de configuration (`display_name`, `type`, `container_name`, `configured`) ne sont jamais écrasés par un sync.

### Routes API

| Méthode | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/apps/sync` | ✅ | Scan GitHub, upsert repos dans `apps` |
| `GET` | `/api/v1/apps` | ✅ | Liste toutes les apps enrichies (état live) |
| `PUT` | `/api/v1/apps/:id` | ✅ | Configure une app — body: `{ display_name, type, container_name, tag_ids[] }` |
| `GET` | `/api/v1/tags` | ✅ | Liste les predefined_tags |
| `POST` | `/api/v1/tags` | ✅ | Crée un nouveau tag prédéfini |

### Enrichissement live dans `GET /api/v1/apps`

Pour chaque app configurée (avec `container_name`), le backend enrichit la réponse en parallèle (`Promise.all`) :

1. **Statut GitHub Actions** : `GET /repos/{owner}/{repo}/actions/runs?per_page=1` → `status` (`completed`/`in_progress`/`queued`) + `conclusion` (`success`/`failure`/`cancelled`)
2. **Statut container Docker** : réutilise l'infra existante du Docker socket (DASH-3)

Les apps non configurées ne déclenchent aucun appel live.

La réponse de `GET /api/v1/apps` inclut pour chaque app ses tags complets (label, color, category) via une jointure `app_tags → predefined_tags`, pas seulement les IDs.

### Architecture DDD (patterns existants)

**Resources** (SQL) :
- `apps.resource.ts`
- `predefined_tags.resource.ts`
- `app_tags.resource.ts`

**Repositories** :
- `apps.repository.ts` — `findAll()`, `upsertFromGitHub()`, `configure()`
- `tags.repository.ts` — `findAll()`, `create()`

**Use-cases** :
- `SyncAppsUseCase` — appel GitHub Code Search + upsert
- `GetAppsUseCase` — fetch DB + enrichissement live parallèle
- `ConfigureAppUseCase` — mise à jour app + tags
- `GetTagsUseCase`
- `CreateTagUseCase`

**Services** :
- `src/domain/use-cases/apps/github/github-search.service.ts` — appel Code Search API
- `src/domain/use-cases/apps/github/github-actions.service.ts` — appel Actions runs API
- `src/domain/use-cases/apps/docker/container-status.service.ts` — réutilise Docker socket

---

## DASH-10 — Frontend : Page Applications

### Route

`/applications` — protégée (auth requise), ajoutée dans `src/router/index.ts`

### Layout global

- Header : titre "Applications" (font-display, neon-emerald) + bouton "↻ Synchroniser" (appelle `POST /api/v1/apps/sync` puis recharge la liste)
- Liste verticale style tableau (option B validée)

### Colonnes du tableau

| Colonne | Contenu |
|---|---|
| Application | Nom affiché (ou repo_name si non configuré) + URL repo en sous-titre |
| Type | Badge coloré (`frontend` vert, `backend` violet, `fullstack` émeraude) |
| Tags | Pills colorées (couleur du tag) |
| Deploy | Point coloré + label (`OK` / `KO` / `En cours` / `—`) |
| Container | Point coloré + label (`Running` / `Stopped` / `—`) |

### Apps non configurées

- Ligne en `border-dashed` avec badge ambre "⚙ À configurer"
- Colonnes Type / Tags / Deploy / Container affichent `—`
- Clic sur la ligne → ouvre la modale de configuration

### Modale de configuration

Champs :
1. **Nom affiché** — text input
2. **Type** — sélecteur 3 boutons (`Frontend` / `Backend` / `Fullstack`)
3. **Nom du container Docker** — text input
4. **Tags** — pills cliquables (sélectionné = coloré, non sélectionné = grisé) + bouton "+ Nouveau tag" (ouvre un sous-formulaire inline pour créer un `predefined_tag`)

Actions : `Annuler` / `Enregistrer` (appelle `PUT /api/v1/apps/:id` + recharge la liste)

### Stores et services

- `src/stores/apps.store.ts` — `apps[]`, `tags[]`, `loading`, `sync()`, `configure()`
- `src/services/apps.service.ts` — `syncApps()`, `getApps()`, `configureApp()`, `getTags()`, `createTag()`

### Composants

| Composant | Type | Description |
|---|---|---|
| `AppRow` | molecule | Ligne du tableau (app + états) |
| `AppConfigModal` | molecule | Modale de configuration |
| `TagPill` | atom | Pill de tag cliquable/affichage |
| `ApplicationsPage` | page | Page `/applications` |

### Tests

- **E2E Playwright** : affichage liste, clic sync, ouverture modale, soumission formulaire, comportement app non configurée
- **Unitaires Vitest** : `AppRow`, `AppConfigModal`, `TagPill`

---

## Flux complet

```
User clique "Synchroniser"
  → POST /api/v1/apps/sync
    → GitHub Code Search API
    → Upsert dans apps (repo_name, repo_url, last_synced_at)
  → GET /api/v1/apps
    → Pour chaque app configurée : GitHub Actions + Docker socket (parallèle)
    → Retourne liste enrichie
  → Affichage dans le tableau

User clique une app "À configurer"
  → Ouverture modale
  → User remplit display_name, type, container_name, tags
  → PUT /api/v1/apps/:id
  → GET /api/v1/apps → refresh liste
```
