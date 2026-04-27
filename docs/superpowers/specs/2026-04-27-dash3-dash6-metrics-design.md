# Feature 1 — Métriques Dashboard (DASH-3 à DASH-6)

## Objectif

Afficher sur la page dashboard : les métriques serveur en temps réel (CPU%, RAM) via SSE + Docker socket, un historique graphé via Victoria Metrics, et les visites uniques (globales + top 3 apps) via Cloudflare API + Loki.

---

## Périmètre

| Ticket | Description |
|--------|-------------|
| DASH-3 | Backend : SSE métriques live + endpoint historique (Docker socket + Victoria Metrics) |
| DASH-4 | Backend : endpoint visites uniques (CF API global + Loki top 3) |
| DASH-5 | Frontend : page dashboard métriques temps réel + graphe historique |
| DASH-6 | Frontend : section visites globales + top 3 apps |

---

## Architecture backend

### Middleware auth

Tous les nouveaux endpoints sont protégés par un middleware JWT cookie. Le middleware lit le cookie `jwt`, vérifie la signature HS256, et renvoie 401 si absent ou invalide.

### DASH-3 — Métriques serveur

**`GET /api/v1/metrics/live`** — SSE

- Connexion Server-Sent Events persistante
- Lit les stats de tous les containers via Docker socket (`/var/run/docker.sock`)
- Calcule toutes les 2 secondes :
  - `cpu` : pourcentage CPU agrégé tous containers (formule Docker stats : `(cpuDelta / systemDelta) * numCPUs * 100`)
  - `ram.used` : somme `memory_stats.usage` de tous les containers (Mo)
  - `ram.total` : `memory_stats.limit` du premier container (limite host, identique pour tous)
- Format SSE :
  ```
  data: {"cpu":42.3,"ram":{"used":3891,"total":8192}}\n\n
  ```
- Ferme la connexion proprement si le client se déconnecte

**`GET /api/v1/metrics/history?range=1h|24h|7d`** — JSON

- Requête PromQL sur Victoria Metrics (`http://victoria-metrics:8428/api/v1/query_range`)
- Paramètres par range :
  - `1h` : step 30s, start = now-1h
  - `24h` : step 5min, start = now-24h
  - `7d` : step 1h, start = now-7d
- Deux séries — noms de métriques à confirmer selon le scraping configuré dans Victoria Metrics (ex. cAdvisor : `container_cpu_usage_seconds_total`, `container_memory_usage_bytes`)
- Réponse :
  ```json
  {
    "cpu": [{ "t": 1714220000, "v": 42.3 }, ...],
    "ram": [{ "t": 1714220000, "v": 3891 }, ...]
  }
  ```

### DASH-4 — Visites uniques

**`GET /api/v1/visits`** — JSON

- **Global** : Cloudflare Analytics API v1 — `GET /client/v4/zones/{ZONE_ID}/analytics/dashboard?since=-1440` (dernières 24h). Extrait `totals.uniques.all`.
- **Top 3 apps** : Loki LogQL — requête `topk(3, sum by (app) (count_over_time({job="traefik"}[24h])))` sur `http://loki:3100`. Mappe le label `app` (= sous-domaine dans les logs Traefik) au nom de l'app.
- Variables d'environnement requises : `CF_API_TOKEN`, `CF_ZONE_ID`, `LOKI_URL`
- Réponse :
  ```json
  {
    "total24h": 1240,
    "topApps": [
      { "name": "portfolio", "visits": 540 },
      { "name": "api", "visits": 310 },
      { "name": "blog", "visits": 120 }
    ]
  }
  ```
- Cache de 5 minutes côté backend (les données CF/Loki ne changent pas à la seconde)

---

## Architecture frontend

### Nouveaux fichiers

| Fichier | Rôle |
|---------|------|
| `src/services/metrics.service.ts` | `connectLive(onData, onError)` (SSE), `fetchHistory(range)`, `fetchVisits()` |
| `src/stores/metrics.store.ts` | État live (cpu, ram), historique, visites, statut SSE |
| `src/components/atoms/GaugeCircle/GaugeCircle.vue` | Jauge circulaire SVG (props: value 0-100, label, sublabel) |
| `src/components/atoms/LineChart/LineChart.vue` | Graphe Chart.js canvas (props: datasets, labels) |
| `src/components/molecules/MetricCard/MetricCard.vue` | Glass card avec GaugeCircle + titre + statut SSE |
| `src/components/molecules/VisitsPanel/VisitsPanel.vue` | Total 24h + liste top 3 apps |
| `src/components/pages/DashboardPage/DashboardPage.vue` | Assemblage + logique de cycle de vie |

### Layout (validé)

```
┌─────────────────────────────────────────────┐
│  AppHeader                                   │
├──────────────────┬──────────────────────────┤
│  MetricCard CPU  │                          │
│  (jauge circ.)   │     VisitsPanel          │
├──────────────────┤  (total 24h + top 3)     │
│  MetricCard RAM  │                          │
│  (jauge circ.)   │                          │
├──────────────────┴──────────────────────────┤
│  LineChart  [1h | 24h | 7j]  (CPU + RAM)   │
└─────────────────────────────────────────────┘
```

### GaugeCircle

- SVG circle avec `stroke-dasharray` / `stroke-dashoffset` calculés depuis `value`
- Couleur adaptive :
  - `value < 70` → `var(--color-emerald)`
  - `70 ≤ value < 90` → `var(--color-amber)` (à ajouter au design system si absent)
  - `value ≥ 90` → `var(--color-error)`
- Transition CSS `stroke-dashoffset` pour animation fluide des mises à jour SSE

### LineChart

- Chart.js instancié manuellement sur un `<canvas ref>` (pas de wrapper Vue)
- Thème dark : fond transparent, grille `--color-border`, texte `--color-text-muted`
- Deux datasets : CPU (émeraude) et RAM (bleu navy)
- `chart.update('none')` pour les updates SSE (sans animation)
- Sélecteur 1h / 24h / 7j appelle `fetchHistory(range)` et remplace les données

### SSE — métriques.service.ts

```ts
connectLive(onData, onError): () => void
```
- Ouvre un `EventSource('/api/v1/metrics/live')`
- Parse chaque `event.data` et appelle `onData`
- Sur `onerror` : reconnexion automatique avec backoff exponentiel (1s → 2s → 4s → max 30s)
- Retourne une fonction de cleanup (ferme l'EventSource)

### DashboardPage cycle de vie

- `onMounted` : lance SSE + fetch visites + fetch historique (range par défaut : 1h)
- `onUnmounted` : ferme l'EventSource via la fonction cleanup
- Gestion d'erreur : si SSE déconnecté > 30s, afficher banner "Connexion perdue"

### État SSE dans le store

```ts
type SseStatus = 'connecting' | 'connected' | 'reconnecting' | 'error'
```
Affiché comme indicateur (point coloré) dans le header de la colonne métriques.

---

## Gestion des erreurs

| Cas | Comportement |
|-----|-------------|
| Backend inaccessible (SSE) | Reconnexion auto + indicateur "reconnecting" |
| Victoria Metrics indisponible | Message d'erreur dans le graphe, données précédentes conservées |
| CF API / Loki indisponible | Valeurs `-` dans VisitsPanel, pas de crash |
| 401 sur n'importe quel endpoint | `handle401()` → redirection `/connexion` |

---

## Tests

- **Backend (Mocha)** : unit tests sur le calcul CPU% (formule Docker stats), le formatage des séries historiques, le parsing des réponses CF/Loki
- **Frontend (Vitest)** : unit tests `GaugeCircle` (couleur selon valeur), `VisitsPanel` (rendu des top apps), `metrics.store` (mutations)
- **E2E (Playwright)** : mock SSE + mock `/api/v1/visits` → vérifier que les valeurs s'affichent sur `/dashboard`

---

## Comportement en dev (services externes absents)

| Service absent | Comportement |
|----------------|-------------|
| Victoria Metrics (`VICTORIA_METRICS_URL` non défini) | `GET /metrics/history` retourne `{ cpu: [], ram: [] }` |
| Cloudflare API (`CF_API_TOKEN` non défini) | `total24h: null` dans la réponse |
| Loki (`LOKI_URL` non défini) | `topApps: []` dans la réponse |
| Docker socket inaccessible | SSE envoie `{ error: "docker_unavailable" }` et ferme |

Le frontend gère toutes ces valeurs nulles/vides sans crash (état "indisponible" dans les composants).

---

## Variables d'environnement à ajouter (backend)

| Variable | Description |
|----------|-------------|
| `DOCKER_SOCKET` | Chemin socket Docker (défaut : `/var/run/docker.sock`) |
| `VICTORIA_METRICS_URL` | URL Victoria Metrics (ex: `http://victoria-metrics:8428`) |
| `CF_API_TOKEN` | Token Cloudflare Analytics |
| `CF_ZONE_ID` | Zone ID Cloudflare |
| `LOKI_URL` | URL Loki (ex: `http://loki:3100`) |
