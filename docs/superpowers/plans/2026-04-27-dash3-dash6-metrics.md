# Feature 1 — Métriques Dashboard (DASH-3 à DASH-6) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Afficher sur `/dashboard` les métriques serveur live (CPU%, RAM) via SSE + Docker socket, un historique graphé via Victoria Metrics, et les visites uniques (globales + top 3 apps) via Cloudflare API + Loki.

**Architecture:** Backend — middleware auth JWT cookie, use-cases métriques/visites, routes SSE + REST. Frontend — service SSE avec reconnexion, store Pinia, composants GaugeCircle + LineChart + MetricCard + VisitsPanel, DashboardPage en layout 2-colonnes + graphe pleine largeur.

**Tech Stack:** Hono (SSE via `streamSSE`), Node.js `http` (Docker socket Unix), Chart.js 4 (graphes), Vue 3 Composition API, Pinia, Vitest, Playwright.

---

## Structure des fichiers

**Backend — créer :**
- `backend/src/entry-points/middleware/require-auth.ts`
- `backend/src/domain/use-cases/metrics/get-live-metrics/get-live-metrics.service.ts`
- `backend/src/domain/use-cases/metrics/get-live-metrics/get-live-metrics.use-case.ts`
- `backend/src/domain/use-cases/metrics/get-history/get-history.service.ts`
- `backend/src/domain/use-cases/metrics/get-history/get-history.use-case.ts`
- `backend/src/domain/use-cases/visits/get-visits/get-visits.service.ts`
- `backend/src/domain/use-cases/visits/get-visits/get-visits.use-case.ts`
- `backend/src/entry-points/routes/metrics.ts`
- `backend/src/entry-points/routes/visits.ts`

**Backend — modifier :**
- `backend/src/config/params/server.config.ts` (5 nouvelles vars)
- `backend/src/domain/use-cases/index.ts` (nouveaux exports)
- `backend/src/entry-points/app.ts` (mount nouvelles routes)

**Frontend — créer :**
- `frontend/src/services/metrics.service.ts`
- `frontend/src/stores/metrics.store.ts`
- `frontend/src/components/atoms/GaugeCircle/GaugeCircle.vue`
- `frontend/src/components/atoms/GaugeCircle/GaugeCircle.spec.ts`
- `frontend/src/components/atoms/LineChart/LineChart.vue`
- `frontend/src/components/molecules/MetricCard/MetricCard.vue`
- `frontend/src/components/molecules/MetricCard/MetricCard.spec.ts`
- `frontend/src/components/molecules/VisitsPanel/VisitsPanel.vue`
- `frontend/src/components/molecules/VisitsPanel/VisitsPanel.spec.ts`
- `frontend/e2e/dashboard.spec.ts`

**Frontend — modifier :**
- `frontend/src/assets/style/themes.css` (ajouter amber)
- `frontend/src/components/pages/DashboardPage/DashboardPage.vue` (réécriture)

---

## Task 1 : Config backend + middleware auth

**Files:**
- Modify: `backend/src/config/params/server.config.ts`
- Create: `backend/src/entry-points/middleware/require-auth.ts`

- [ ] **Step 1 : Ajouter les 5 nouvelles variables d'environnement dans server.config.ts**

Ouvrir `backend/src/config/params/server.config.ts` et ajouter à la fin de l'objet exporté (avant la fermeture `}`) :

```typescript
	DockerSocket: {
		name: 'DOCKER_SOCKET',
		description: 'Path to Docker Unix socket',
		default: {
			_: '/var/run/docker.sock',
		},
		validator: z.string().min(1),
	},
	VictoriaMetricsUrl: {
		name: 'VICTORIA_METRICS_URL',
		description: 'Victoria Metrics base URL',
		default: {
			_: null,
		},
		validator: z.string().url().nullish().default(null),
	},
	CfApiToken: {
		name: 'CF_API_TOKEN',
		description: 'Cloudflare API token',
		default: {
			_: null,
		},
		validator: z.string().nullish().default(null),
	},
	CfZoneId: {
		name: 'CF_ZONE_ID',
		description: 'Cloudflare Zone ID',
		default: {
			_: null,
		},
		validator: z.string().nullish().default(null),
	},
	LokiUrl: {
		name: 'LOKI_URL',
		description: 'Loki base URL',
		default: {
			_: null,
		},
		validator: z.string().url().nullish().default(null),
	},
```

Also update the type annotation in `backend/src/config/index.ts` — add to the type object after `InitPassword: string`:
```typescript
			DockerSocket: string
			VictoriaMetricsUrl: string | null
			CfApiToken: string | null
			CfZoneId: string | null
			LokiUrl: string | null
```

- [ ] **Step 2 : Créer le middleware require-auth.ts**

```typescript
// backend/src/entry-points/middleware/require-auth.ts
import { AppError } from '@errors/app.error'
import { getCookie } from 'hono/cookie'
import type { MiddlewareHandler } from 'hono'
import { checkJwtCookie } from '../../domain/use-cases/auth/get-auth/get-auth-status.service'

export const requireAuth: MiddlewareHandler = async (c, next) => {
	const token = getCookie(c, 'jwt')
	if (!token) throw new AppError('unauthorized', 'Authentication required')
	const valid = await checkJwtCookie(token)
	if (!valid) throw new AppError('unauthorized', 'Invalid or expired session')
	await next()
}
```

- [ ] **Step 3 : Vérifier que le projet compile**

```bash
cd backend && npx tsc --noEmit
```

Expected: pas d'erreur de type.

- [ ] **Step 4 : Commit**

```bash
git add backend/src/config/params/server.config.ts backend/src/config/index.ts backend/src/entry-points/middleware/require-auth.ts
git commit -m "feat(DASH-3): config vars externes + middleware requireAuth"
```

---

## Task 2 : Service Docker live metrics (fonctions pures + tests)

**Files:**
- Create: `backend/src/domain/use-cases/metrics/get-live-metrics/get-live-metrics.service.ts`
- Create: `backend/src/domain/use-cases/metrics/__tests__/get-live-metrics.service.spec.ts`

- [ ] **Step 1 : Écrire les tests (TDD)**

```typescript
// backend/src/domain/use-cases/metrics/__tests__/get-live-metrics.service.spec.ts
import { expect } from 'chai'
import { calcCpuPercent, calcRamMb } from '../get-live-metrics/get-live-metrics.service'

const makeStats = (cpuDelta: number, systemDelta: number, numCpus: number, usage: number, limit: number, cache = 0) => ({
	cpu_stats: {
		cpu_usage: { total_usage: cpuDelta + 1000 },
		system_cpu_usage: systemDelta + 100000,
		online_cpus: numCpus,
	},
	precpu_stats: {
		cpu_usage: { total_usage: 1000 },
		system_cpu_usage: 100000,
	},
	memory_stats: {
		usage,
		limit,
		stats: { inactive_file: cache },
	},
})

describe('get-live-metrics service', () => {
	describe('calcCpuPercent', () => {
		it('calcule le pourcentage CPU correctement', () => {
			// 1/4 du système avec 4 CPUs = 100%
			const stats = makeStats(1000, 4000, 4, 0, 0)
			const result = calcCpuPercent(stats as any)
			expect(result).to.be.closeTo(100, 0.1)
		})

		it('retourne 0 si systemDelta est 0', () => {
			const stats = makeStats(1000, 0, 4, 0, 0)
			const result = calcCpuPercent(stats as any)
			expect(result).to.equal(0)
		})

		it('retourne 0 si cpuDelta est négatif', () => {
			const base = {
				cpu_stats: { cpu_usage: { total_usage: 500 }, system_cpu_usage: 200000, online_cpus: 4 },
				precpu_stats: { cpu_usage: { total_usage: 1000 }, system_cpu_usage: 100000 },
				memory_stats: { usage: 0, limit: 0 },
			}
			expect(calcCpuPercent(base as any)).to.equal(0)
		})
	})

	describe('calcRamMb', () => {
		it('soustrait le cache de la RAM utilisée', () => {
			const stats = makeStats(0, 1, 1, 400 * 1024 * 1024, 8 * 1024 * 1024 * 1024, 100 * 1024 * 1024)
			expect(calcRamMb(stats as any)).to.equal(300)
		})

		it('utilise usage brut si pas de cache', () => {
			const stats = { memory_stats: { usage: 512 * 1024 * 1024, limit: 8 * 1024 * 1024 * 1024 }, cpu_stats: { cpu_usage: { total_usage: 0 }, system_cpu_usage: 0, online_cpus: 1 }, precpu_stats: { cpu_usage: { total_usage: 0 }, system_cpu_usage: 0 } }
			expect(calcRamMb(stats as any)).to.equal(512)
		})
	})
})
```

- [ ] **Step 2 : Lancer les tests pour vérifier qu'ils échouent**

```bash
cd backend && npm test
```

Expected: FAIL — `calcCpuPercent is not a function`

- [ ] **Step 3 : Implémenter le service**

```typescript
// backend/src/domain/use-cases/metrics/get-live-metrics/get-live-metrics.service.ts
import http from 'node:http'
import Config from '@config'

interface DockerContainerStats {
	cpu_stats: {
		cpu_usage: { total_usage: number }
		system_cpu_usage: number
		online_cpus?: number
	}
	precpu_stats: {
		cpu_usage: { total_usage: number }
		system_cpu_usage: number
	}
	memory_stats: {
		usage: number
		limit: number
		stats?: { inactive_file?: number; cache?: number }
	}
}

interface DockerInfo {
	MemTotal: number
}

export interface LiveMetrics {
	cpu: number
	ram: { used: number; total: number }
}

function dockerGet<T>(path: string): Promise<T> {
	return new Promise((resolve, reject) => {
		const req = http.get(
			{ socketPath: Config.Server.DockerSocket, path },
			(res) => {
				const chunks: Buffer[] = []
				res.on('data', (chunk) => chunks.push(chunk))
				res.on('end', () => {
					try {
						resolve(JSON.parse(Buffer.concat(chunks).toString()))
					} catch (e) {
						reject(e)
					}
				})
			},
		)
		req.on('error', reject)
	})
}

export function calcCpuPercent(stats: DockerContainerStats): number {
	const cpuDelta =
		stats.cpu_stats.cpu_usage.total_usage -
		stats.precpu_stats.cpu_usage.total_usage
	const systemDelta =
		stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage
	const numCpus = stats.cpu_stats.online_cpus ?? 1
	if (systemDelta <= 0 || cpuDelta < 0) return 0
	return (cpuDelta / systemDelta) * numCpus * 100
}

export function calcRamMb(stats: DockerContainerStats): number {
	const cache =
		stats.memory_stats.stats?.inactive_file ??
		stats.memory_stats.stats?.cache ??
		0
	return Math.round((stats.memory_stats.usage - cache) / 1024 / 1024)
}

export async function fetchLiveMetrics(): Promise<LiveMetrics> {
	const [info, containers] = await Promise.all([
		dockerGet<DockerInfo>('/info'),
		dockerGet<{ Id: string }[]>('/containers/json'),
	])

	const statsArray = await Promise.all(
		containers.map((c) =>
			dockerGet<DockerContainerStats>(`/containers/${c.Id}/stats?stream=false`),
		),
	)

	const totalRamMb = Math.round(info.MemTotal / 1024 / 1024)
	const usedRamMb = statsArray.reduce((sum, s) => sum + calcRamMb(s), 0)
	const totalCpu = statsArray.reduce((sum, s) => sum + calcCpuPercent(s), 0)
	const cpuPercent = Math.min(Math.round(totalCpu * 10) / 10, 100)

	return { cpu: cpuPercent, ram: { used: usedRamMb, total: totalRamMb } }
}
```

- [ ] **Step 4 : Lancer les tests pour vérifier qu'ils passent**

```bash
cd backend && npm test
```

Expected: `get-live-metrics service` — 4 passing

- [ ] **Step 5 : Commit**

```bash
git add backend/src/domain/use-cases/metrics/ 
git commit -m "feat(DASH-3): service métriques live Docker socket avec tests"
```

---

## Task 3 : Use-case live metrics + use-case historique

**Files:**
- Create: `backend/src/domain/use-cases/metrics/get-live-metrics/get-live-metrics.use-case.ts`
- Create: `backend/src/domain/use-cases/metrics/get-history/get-history.service.ts`
- Create: `backend/src/domain/use-cases/metrics/get-history/get-history.use-case.ts`
- Create: `backend/src/domain/use-cases/metrics/__tests__/get-history.service.spec.ts`

- [ ] **Step 1 : Créer le use-case live metrics**

```typescript
// backend/src/domain/use-cases/metrics/get-live-metrics/get-live-metrics.use-case.ts
import { UseCase } from '../../use-case'
import { type LiveMetrics, fetchLiveMetrics } from './get-live-metrics.service'

class GetLiveMetricsUseCase extends UseCase<LiveMetrics> {
	async Execute() {
		return this.runStep('Fetch Docker stats', fetchLiveMetrics)
	}
}

export const GetLiveMetrics = new GetLiveMetricsUseCase()
```

- [ ] **Step 2 : Écrire les tests pour le service historique**

```typescript
// backend/src/domain/use-cases/metrics/__tests__/get-history.service.spec.ts
import { expect } from 'chai'
import { parseVictoriaResponse } from '../get-history/get-history.service'

describe('get-history service', () => {
	describe('parseVictoriaResponse', () => {
		it('transforme les valeurs en DataPoints {t, v}', () => {
			const vmResponse = {
				status: 'success',
				data: {
					resultType: 'matrix',
					result: [{ metric: {}, values: [[1714220000, '42.3'], [1714220060, '45.1']] }],
				},
			}
			const points = parseVictoriaResponse(vmResponse)
			expect(points).to.deep.equal([
				{ t: 1714220000, v: 42.3 },
				{ t: 1714220060, v: 45.1 },
			])
		})

		it('retourne [] si result est vide', () => {
			const vmResponse = { status: 'success', data: { resultType: 'matrix', result: [] } }
			expect(parseVictoriaResponse(vmResponse)).to.deep.equal([])
		})
	})
})
```

- [ ] **Step 3 : Lancer pour vérifier l'échec**

```bash
cd backend && npm test
```

Expected: FAIL — `parseVictoriaResponse is not a function`

- [ ] **Step 4 : Implémenter le service historique**

```typescript
// backend/src/domain/use-cases/metrics/get-history/get-history.service.ts
import Config from '@config'

export type HistoryRange = '1h' | '24h' | '7d'

export interface DataPoint {
	t: number
	v: number
}

export interface HistoryMetrics {
	cpu: DataPoint[]
	ram: DataPoint[]
}

interface VictoriaResponse {
	status: string
	data: { resultType: string; result: { metric: object; values: [number, string][] }[] }
}

export function parseVictoriaResponse(response: VictoriaResponse): DataPoint[] {
	const result = response.data.result[0]
	if (!result) return []
	return result.values.map(([t, v]) => ({ t, v: parseFloat(v) }))
}

const RANGE_PARAMS: Record<HistoryRange, { step: string; offsetSeconds: number }> = {
	'1h':  { step: '30s',  offsetSeconds: 3600 },
	'24h': { step: '5m',   offsetSeconds: 86400 },
	'7d':  { step: '1h',   offsetSeconds: 604800 },
}

async function queryVictoria(query: string, range: HistoryRange): Promise<DataPoint[]> {
	const baseUrl = Config.Server.VictoriaMetricsUrl
	if (!baseUrl) return []

	const now = Math.floor(Date.now() / 1000)
	const { step, offsetSeconds } = RANGE_PARAMS[range]
	const params = new URLSearchParams({
		query,
		start: String(now - offsetSeconds),
		end: String(now),
		step,
	})

	const res = await fetch(`${baseUrl}/api/v1/query_range?${params}`)
	if (!res.ok) return []
	const data: VictoriaResponse = await res.json()
	return parseVictoriaResponse(data)
}

export async function fetchHistory(range: HistoryRange): Promise<HistoryMetrics> {
	const CPU_QUERY = `100 * (1 - avg(rate(node_cpu_seconds_total{mode="idle"}[5m])))`
	const RAM_QUERY = `(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / 1048576`

	const [cpu, ram] = await Promise.all([
		queryVictoria(CPU_QUERY, range),
		queryVictoria(RAM_QUERY, range),
	])
	return { cpu, ram }
}
```

- [ ] **Step 5 : Créer le use-case historique**

```typescript
// backend/src/domain/use-cases/metrics/get-history/get-history.use-case.ts
import { UseCase } from '../../use-case'
import { type HistoryMetrics, type HistoryRange, fetchHistory } from './get-history.service'

class GetHistoryUseCase extends UseCase<HistoryMetrics> {
	async Execute(range: HistoryRange) {
		return this.runStep('Fetch Victoria Metrics history', fetchHistory.bind(this, range))
	}
}

export const GetHistory = new GetHistoryUseCase()
```

- [ ] **Step 6 : Lancer les tests**

```bash
cd backend && npm test
```

Expected: tous les tests passent (maintenant 9 passing)

- [ ] **Step 7 : Commit**

```bash
git add backend/src/domain/use-cases/metrics/
git commit -m "feat(DASH-3): use-cases métriques live + historique Victoria Metrics"
```

---

## Task 4 : Service visites (CF API + Loki) + use-case

**Files:**
- Create: `backend/src/domain/use-cases/visits/get-visits/get-visits.service.ts`
- Create: `backend/src/domain/use-cases/visits/get-visits/get-visits.use-case.ts`
- Create: `backend/src/domain/use-cases/visits/__tests__/get-visits.service.spec.ts`

- [ ] **Step 1 : Écrire les tests**

```typescript
// backend/src/domain/use-cases/visits/__tests__/get-visits.service.spec.ts
import { expect } from 'chai'
import { parseLokiTopApps } from '../get-visits/get-visits.service'

describe('get-visits service', () => {
	describe('parseLokiTopApps', () => {
		it('transforme la réponse Loki en liste {name, visits}', () => {
			const lokiResponse = {
				status: 'success',
				data: {
					resultType: 'vector',
					result: [
						{ metric: { app: 'portfolio' }, value: [1714220000, '540'] },
						{ metric: { app: 'api' }, value: [1714220000, '310'] },
					],
				},
			}
			const result = parseLokiTopApps(lokiResponse)
			expect(result).to.deep.equal([
				{ name: 'portfolio', visits: 540 },
				{ name: 'api', visits: 310 },
			])
		})

		it('retourne [] si result est vide', () => {
			const empty = { status: 'success', data: { resultType: 'vector', result: [] } }
			expect(parseLokiTopApps(empty)).to.deep.equal([])
		})
	})
})
```

- [ ] **Step 2 : Lancer pour vérifier l'échec**

```bash
cd backend && npm test
```

Expected: FAIL — `parseLokiTopApps is not a function`

- [ ] **Step 3 : Implémenter le service**

```typescript
// backend/src/domain/use-cases/visits/get-visits/get-visits.service.ts
import Config from '@config'

export interface TopApp {
	name: string
	visits: number
}

export interface VisitsData {
	total24h: number | null
	topApps: TopApp[]
}

interface LokiResponse {
	status: string
	data: { resultType: string; result: { metric: Record<string, string>; value: [number, string] }[] }
}

export function parseLokiTopApps(response: LokiResponse): TopApp[] {
	return response.data.result.map((r) => ({
		name: r.metric.app ?? 'unknown',
		visits: parseInt(r.value[1], 10),
	}))
}

let visitsCache: { data: VisitsData; expiresAt: number } | null = null
const CACHE_TTL_MS = 5 * 60 * 1000

export async function fetchGlobalVisits(): Promise<number | null> {
	const token = Config.Server.CfApiToken
	const zoneId = Config.Server.CfZoneId
	if (!token || !zoneId) return null

	const res = await fetch(
		`https://api.cloudflare.com/client/v4/zones/${zoneId}/analytics/dashboard?since=-1440&until=0`,
		{ headers: { Authorization: `Bearer ${token}` } },
	)
	if (!res.ok) return null

	const data = await res.json()
	return data?.result?.totals?.uniques?.all ?? null
}

export async function fetchTopApps(): Promise<TopApp[]> {
	const lokiUrl = Config.Server.LokiUrl
	if (!lokiUrl) return []

	const query = encodeURIComponent(`topk(3, sum by (app) (count_over_time({job="traefik"}[24h])))`)
	const res = await fetch(`${lokiUrl}/loki/api/v1/query?query=${query}`)
	if (!res.ok) return []

	const data: LokiResponse = await res.json()
	return parseLokiTopApps(data)
}

export async function fetchVisits(): Promise<VisitsData> {
	if (visitsCache && visitsCache.expiresAt > Date.now()) {
		return visitsCache.data
	}
	const [total24h, topApps] = await Promise.all([fetchGlobalVisits(), fetchTopApps()])
	const result: VisitsData = { total24h, topApps }
	visitsCache = { data: result, expiresAt: Date.now() + CACHE_TTL_MS }
	return result
}
```

- [ ] **Step 4 : Créer le use-case**

```typescript
// backend/src/domain/use-cases/visits/get-visits/get-visits.use-case.ts
import { UseCase } from '../../use-case'
import { type VisitsData, fetchVisits } from './get-visits.service'

class GetVisitsUseCase extends UseCase<VisitsData> {
	async Execute() {
		return this.runStep('Fetch visits data', fetchVisits)
	}
}

export const GetVisits = new GetVisitsUseCase()
```

- [ ] **Step 5 : Lancer les tests**

```bash
cd backend && npm test
```

Expected: tous les tests passent (maintenant 11 passing)

- [ ] **Step 6 : Commit**

```bash
git add backend/src/domain/use-cases/visits/
git commit -m "feat(DASH-4): service visites CF API + Loki avec cache 5min"
```

---

## Task 5 : Routes backend + wiring

**Files:**
- Create: `backend/src/entry-points/routes/metrics.ts`
- Create: `backend/src/entry-points/routes/visits.ts`
- Modify: `backend/src/domain/use-cases/index.ts`
- Modify: `backend/src/entry-points/app.ts`

- [ ] **Step 1 : Créer la route metrics**

```typescript
// backend/src/entry-points/routes/metrics.ts
import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { z } from 'zod'
import { requireAuth } from '../middleware/require-auth'
import { GetHistory } from '../../domain/use-cases/metrics/get-history/get-history.use-case'
import { GetLiveMetrics } from '../../domain/use-cases/metrics/get-live-metrics/get-live-metrics.use-case'
import type { HistoryRange } from '../../domain/use-cases/metrics/get-history/get-history.service'

const historyRangeSchema = z.enum(['1h', '24h', '7d'])

const metricsRoute = new Hono().basePath('/metrics')

metricsRoute.use('*', requireAuth)

metricsRoute.get('/live', async (c) => {
	return streamSSE(c, async (sse) => {
		while (!sse.aborted) {
			try {
				const data = await GetLiveMetrics.Execute()
				await sse.writeSSE({ data: JSON.stringify(data) })
			} catch {
				await sse.writeSSE({ data: JSON.stringify({ error: 'docker_unavailable' }) })
			}
			await sse.sleep(2000)
		}
	})
})

metricsRoute.get('/history', async (c) => {
	const rangeParam = c.req.query('range') ?? '1h'
	const parsed = historyRangeSchema.safeParse(rangeParam)
	const range: HistoryRange = parsed.success ? parsed.data : '1h'
	return c.json(await GetHistory.Execute(range))
})

export default metricsRoute
```

- [ ] **Step 2 : Créer la route visits**

```typescript
// backend/src/entry-points/routes/visits.ts
import { Hono } from 'hono'
import { requireAuth } from '../middleware/require-auth'
import { GetVisits } from '../../domain/use-cases/visits/get-visits/get-visits.use-case'

const visitsRoute = new Hono().basePath('/visits')

visitsRoute.use('*', requireAuth)

visitsRoute.get('/', async (c) => {
	return c.json(await GetVisits.Execute())
})

export default visitsRoute
```

- [ ] **Step 3 : Mettre à jour l'index des use-cases**

Modifier `backend/src/domain/use-cases/index.ts` :

```typescript
export { GetAuthStatus } from './auth/get-auth/get-auth-status.use-case'
export { GetChallenge } from './auth/get-challenge/get-challenge.use-case'
export { InitFirstAuth } from './auth/init-first-auth/init-first-auth.use-case'
export { VerifyAuth } from './auth/verify-auth/verify-auth.use-case'
export { GetLiveMetrics } from './metrics/get-live-metrics/get-live-metrics.use-case'
export { GetHistory } from './metrics/get-history/get-history.use-case'
export { GetVisits } from './visits/get-visits/get-visits.use-case'
```

- [ ] **Step 4 : Monter les routes dans app.ts**

Modifier `backend/src/entry-points/app.ts` :

```typescript
import config from '@config'
import { handleHttpErrors } from '@errors/handle-http-errors'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import authRoute from './routes/auth'
import metricsRoute from './routes/metrics'
import visitsRoute from './routes/visits'

const app = new Hono().basePath('/api/v1')

app.use(cors({ origin: config.Server.ClientUrls, credentials: true }))
app.onError(handleHttpErrors)

app.route('/', authRoute)
app.route('/', metricsRoute)
app.route('/', visitsRoute)

export default app
```

- [ ] **Step 5 : Vérifier la compilation TypeScript**

```bash
cd backend && npx tsc --noEmit
```

Expected: 0 erreurs

- [ ] **Step 6 : Lancer tous les tests**

```bash
cd backend && npm test
```

Expected: 11 passing

- [ ] **Step 7 : Commit**

```bash
git add backend/src/entry-points/ backend/src/domain/use-cases/index.ts
git commit -m "feat(DASH-3/4): routes /metrics (SSE + history) et /visits"
```

---

## Task 6 : Frontend — service + types

**Files:**
- Create: `frontend/src/services/metrics.service.ts`

- [ ] **Step 1 : Créer metrics.service.ts**

```typescript
// frontend/src/services/metrics.service.ts
import { handle401 } from "./auth.service";

export interface LiveMetrics {
  cpu: number;
  ram: { used: number; total: number };
}

export interface DataPoint {
  t: number;
  v: number;
}

export interface HistoryMetrics {
  cpu: DataPoint[];
  ram: DataPoint[];
}

export interface TopApp {
  name: string;
  visits: number;
}

export interface VisitsData {
  total24h: number | null;
  topApps: TopApp[];
}

export type HistoryRange = "1h" | "24h" | "7d";

export function connectLive(
  onData: (metrics: LiveMetrics) => void,
  onStatusChange: (status: "connected" | "reconnecting" | "error") => void,
): () => void {
  let es: EventSource | null = null;
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let destroyed = false;
  let backoff = 1000;

  function connect() {
    if (destroyed) return;
    es = new EventSource("/api/v1/metrics/live");

    es.onmessage = (event) => {
      backoff = 1000;
      const data = JSON.parse(event.data);
      if (data.error) {
        onStatusChange("error");
      } else {
        onStatusChange("connected");
        onData(data as LiveMetrics);
      }
    };

    es.onerror = () => {
      es?.close();
      es = null;
      if (!destroyed) {
        onStatusChange("reconnecting");
        timeout = setTimeout(() => {
          backoff = Math.min(backoff * 2, 30000);
          connect();
        }, backoff);
      }
    };
  }

  connect();

  return () => {
    destroyed = true;
    if (timeout) clearTimeout(timeout);
    es?.close();
  };
}

export async function fetchHistory(range: HistoryRange): Promise<HistoryMetrics> {
  const res = await fetch(`/api/v1/metrics/history?range=${range}`);
  if (res.status === 401) { handle401(); throw new Error("Unauthorized"); }
  if (!res.ok) return { cpu: [], ram: [] };
  return res.json();
}

export async function fetchVisits(): Promise<VisitsData> {
  const res = await fetch("/api/v1/visits");
  if (res.status === 401) { handle401(); throw new Error("Unauthorized"); }
  if (!res.ok) return { total24h: null, topApps: [] };
  return res.json();
}
```

- [ ] **Step 2 : Vérifier le type-check frontend**

```bash
cd frontend && npm run type-check
```

Expected: 0 erreur

- [ ] **Step 3 : Commit**

```bash
git add frontend/src/services/metrics.service.ts
git commit -m "feat(DASH-5): service métriques frontend (SSE + history + visits)"
```

---

## Task 7 : Frontend — store Pinia métriques

**Files:**
- Create: `frontend/src/stores/metrics.store.ts`

- [ ] **Step 1 : Créer metrics.store.ts**

```typescript
// frontend/src/stores/metrics.store.ts
import { defineStore } from "pinia";
import { ref } from "vue";
import type { DataPoint, HistoryRange, TopApp } from "@/services/metrics.service";

export type SseStatus = "connecting" | "connected" | "reconnecting" | "error";

export const useMetricsStore = defineStore("metrics", () => {
  const cpu = ref<number>(0);
  const ramUsed = ref<number>(0);
  const ramTotal = ref<number>(0);
  const sseStatus = ref<SseStatus>("connecting");

  const historyCpu = ref<DataPoint[]>([]);
  const historyRam = ref<DataPoint[]>([]);
  const historyRange = ref<HistoryRange>("1h");

  const total24h = ref<number | null>(null);
  const topApps = ref<TopApp[]>([]);

  function setLive(metrics: { cpu: number; ram: { used: number; total: number } }) {
    cpu.value = metrics.cpu;
    ramUsed.value = metrics.ram.used;
    ramTotal.value = metrics.ram.total;
  }

  function setSseStatus(status: SseStatus) {
    sseStatus.value = status;
  }

  function setHistory(range: HistoryRange, data: { cpu: DataPoint[]; ram: DataPoint[] }) {
    historyRange.value = range;
    historyCpu.value = data.cpu;
    historyRam.value = data.ram;
  }

  function setVisits(data: { total24h: number | null; topApps: TopApp[] }) {
    total24h.value = data.total24h;
    topApps.value = data.topApps;
  }

  return {
    cpu, ramUsed, ramTotal, sseStatus,
    historyCpu, historyRam, historyRange,
    total24h, topApps,
    setLive, setSseStatus, setHistory, setVisits,
  };
});
```

- [ ] **Step 2 : Commit**

```bash
git add frontend/src/stores/metrics.store.ts
git commit -m "feat(DASH-5): store Pinia métriques"
```

---

## Task 8 : Atom GaugeCircle + tests

**Files:**
- Create: `frontend/src/components/atoms/GaugeCircle/GaugeCircle.vue`
- Create: `frontend/src/components/atoms/GaugeCircle/GaugeCircle.spec.ts`
- Modify: `frontend/src/assets/style/themes.css` (ajouter amber)

- [ ] **Step 1 : Ajouter les variables amber dans themes.css**

Dans `frontend/src/assets/style/themes.css`, après la ligne `--color-error-dim: ...;` (dans `:root`), ajouter :

```css
	--color-amber: #f59e0b;
	--color-amber-dim: rgba(245, 158, 11, 0.15);
```

Dans `[data-theme="light"]`, après `--color-error-dim: ...;` :

```css
	--color-amber: #d97706;
	--color-amber-dim: rgba(217, 119, 6, 0.1);
```

- [ ] **Step 2 : Écrire les tests GaugeCircle**

```typescript
// frontend/src/components/atoms/GaugeCircle/GaugeCircle.spec.ts
import { mount } from "@vue/test-utils";
import { describe, it, expect } from "vitest";
import GaugeCircle from "./GaugeCircle.vue";

describe("GaugeCircle", () => {
  it("affiche la valeur passée en props", () => {
    const wrapper = mount(GaugeCircle, { props: { value: 42, label: "CPU" } });
    expect(wrapper.text()).toContain("42");
    expect(wrapper.text()).toContain("CPU");
  });

  it("utilise la couleur émeraude quand value < 70", () => {
    const wrapper = mount(GaugeCircle, { props: { value: 50, label: "CPU" } });
    const arc = wrapper.find(".gauge__arc");
    expect(arc.attributes("stroke")).toContain("var(--color-emerald)");
  });

  it("utilise la couleur amber quand 70 ≤ value < 90", () => {
    const wrapper = mount(GaugeCircle, { props: { value: 75, label: "CPU" } });
    const arc = wrapper.find(".gauge__arc");
    expect(arc.attributes("stroke")).toContain("var(--color-amber)");
  });

  it("utilise la couleur error quand value ≥ 90", () => {
    const wrapper = mount(GaugeCircle, { props: { value: 95, label: "CPU" } });
    const arc = wrapper.find(".gauge__arc");
    expect(arc.attributes("stroke")).toContain("var(--color-error)");
  });
});
```

- [ ] **Step 3 : Lancer pour vérifier l'échec**

```bash
cd frontend && npm run test:unit
```

Expected: FAIL — `Cannot find module './GaugeCircle.vue'`

- [ ] **Step 4 : Implémenter GaugeCircle.vue**

```vue
<!-- frontend/src/components/atoms/GaugeCircle/GaugeCircle.vue -->
<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  value: number;
  label: string;
  sublabel?: string;
}>();

const RADIUS = 40;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const strokeDashoffset = computed(
  () => CIRCUMFERENCE * (1 - Math.min(props.value, 100) / 100),
);

const color = computed(() => {
  if (props.value >= 90) return "var(--color-error)";
  if (props.value >= 70) return "var(--color-amber)";
  return "var(--color-emerald)";
});
</script>

<template>
  <div class="gauge">
    <svg class="gauge__svg" viewBox="0 0 100 100" width="96" height="96">
      <circle
        class="gauge__track"
        cx="50" cy="50"
        :r="RADIUS"
        fill="none"
        stroke="var(--color-bg-tertiary)"
        stroke-width="8"
      />
      <circle
        class="gauge__arc"
        cx="50" cy="50"
        :r="RADIUS"
        fill="none"
        :stroke="color"
        stroke-width="8"
        stroke-linecap="round"
        :stroke-dasharray="CIRCUMFERENCE"
        :stroke-dashoffset="strokeDashoffset"
        transform="rotate(-90 50 50)"
      />
      <text
        x="50" y="46"
        text-anchor="middle"
        class="gauge__value font-display"
        :fill="color"
      >{{ value }}%</text>
      <text
        x="50" y="60"
        text-anchor="middle"
        class="gauge__label"
        fill="var(--color-text-muted)"
      >{{ label }}</text>
    </svg>
    <p v-if="sublabel" class="gauge__sublabel">{{ sublabel }}</p>
  </div>
</template>

<style scoped>
.gauge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.gauge__arc {
  transition: stroke-dashoffset 0.6s ease, stroke 0.3s ease;
}

.gauge__value {
  font-size: 14px;
  font-weight: 700;
  font-family: var(--font-display);
}

.gauge__label {
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.gauge__sublabel {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  margin: 0;
}
</style>
```

- [ ] **Step 5 : Lancer les tests**

```bash
cd frontend && npm run test:unit
```

Expected: GaugeCircle — 4 passing, tous les autres toujours passing

- [ ] **Step 6 : Commit**

```bash
git add frontend/src/components/atoms/GaugeCircle/ frontend/src/assets/style/themes.css
git commit -m "feat(DASH-5): atom GaugeCircle avec couleur adaptive"
```

---

## Task 9 : Atom LineChart (Chart.js)

**Files:**
- Create: `frontend/src/components/atoms/LineChart/LineChart.vue`

- [ ] **Step 1 : Installer Chart.js**

```bash
cd frontend && npm install chart.js
```

Expected: chart.js apparaît dans `package.json` dependencies.

- [ ] **Step 2 : Créer LineChart.vue**

```vue
<!-- frontend/src/components/atoms/LineChart/LineChart.vue -->
<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from "vue";
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Tooltip,
  Filler,
} from "chart.js";
import type { DataPoint } from "@/services/metrics.service";

Chart.register(LineController, LineElement, PointElement, LinearScale, Tooltip, Filler);

const props = defineProps<{
  cpuData: DataPoint[];
  ramData: DataPoint[];
  loading?: boolean;
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
let chart: Chart | null = null;

function buildDatasets() {
  return {
    datasets: [
      {
        label: "CPU %",
        data: props.cpuData.map((p) => ({ x: p.t * 1000, y: p.v })),
        borderColor: "#10b981",
        backgroundColor: "rgba(16,185,129,0.1)",
        borderWidth: 1.5,
        pointRadius: 0,
        fill: true,
        tension: 0.3,
      },
      {
        label: "RAM MB",
        data: props.ramData.map((p) => ({ x: p.t * 1000, y: p.v })),
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59,130,246,0.08)",
        borderWidth: 1.5,
        pointRadius: 0,
        fill: true,
        tension: 0.3,
        yAxisID: "y2",
      },
    ],
  };
}

onMounted(() => {
  if (!canvasRef.value) return;
  chart = new Chart(canvasRef.value, {
    type: "line",
    data: { datasets: buildDatasets().datasets },
    options: {
      animation: false,
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: "linear",
          ticks: { color: "#484f58", maxTicksLimit: 6, callback: (v) => new Date(Number(v)).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
          grid: { color: "rgba(48,54,61,0.4)" },
        },
        y: {
          position: "left",
          ticks: { color: "#10b981", callback: (v) => `${v}%` },
          grid: { color: "rgba(48,54,61,0.4)" },
        },
        y2: {
          position: "right",
          ticks: { color: "#3b82f6", callback: (v) => `${v}M` },
          grid: { drawOnChartArea: false },
        },
      },
      plugins: {
        legend: { labels: { color: "#8b949e", boxWidth: 12, font: { size: 11 } } },
        tooltip: { mode: "index", intersect: false },
      },
    },
  });
});

watch([() => props.cpuData, () => props.ramData], () => {
  if (!chart) return;
  const ds = buildDatasets().datasets;
  chart.data.datasets[0].data = ds[0].data;
  chart.data.datasets[1].data = ds[1].data;
  chart.update("none");
});

onUnmounted(() => {
  chart?.destroy();
});
</script>

<template>
  <div class="line-chart">
    <div v-if="loading" class="line-chart__loading">
      <div class="line-chart__spinner" />
    </div>
    <canvas v-else ref="canvasRef" />
  </div>
</template>

<style scoped>
.line-chart {
  position: relative;
  height: 200px;
  width: 100%;
}

.line-chart__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.line-chart__spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-emerald);
  border-radius: 50%;
  animation: spin-slow 0.8s linear infinite;
}
</style>
```

- [ ] **Step 3 : Vérifier le type-check**

```bash
cd frontend && npm run type-check
```

Expected: 0 erreur

- [ ] **Step 4 : Commit**

```bash
git add frontend/src/components/atoms/LineChart/ frontend/package.json frontend/package-lock.json
git commit -m "feat(DASH-5): atom LineChart Chart.js dual-axis (CPU + RAM)"
```

---

## Task 10 : Molecules MetricCard + VisitsPanel + tests

**Files:**
- Create: `frontend/src/components/molecules/MetricCard/MetricCard.vue`
- Create: `frontend/src/components/molecules/MetricCard/MetricCard.spec.ts`
- Create: `frontend/src/components/molecules/VisitsPanel/VisitsPanel.vue`
- Create: `frontend/src/components/molecules/VisitsPanel/VisitsPanel.spec.ts`

- [ ] **Step 1 : Écrire le test MetricCard**

```typescript
// frontend/src/components/molecules/MetricCard/MetricCard.spec.ts
import { mount } from "@vue/test-utils";
import { describe, it, expect } from "vitest";
import MetricCard from "./MetricCard.vue";

describe("MetricCard", () => {
  it("affiche le titre", () => {
    const wrapper = mount(MetricCard, {
      props: { title: "CPU", value: 42, sublabel: "Actuel" },
    });
    expect(wrapper.text()).toContain("CPU");
  });

  it("affiche le sublabel", () => {
    const wrapper = mount(MetricCard, {
      props: { title: "RAM", value: 60, sublabel: "3.8 / 8 GB" },
    });
    expect(wrapper.text()).toContain("3.8 / 8 GB");
  });

  it("affiche le badge 'Reconnexion' quand status = reconnecting", () => {
    const wrapper = mount(MetricCard, {
      props: { title: "CPU", value: 0, sublabel: "", status: "reconnecting" },
    });
    expect(wrapper.text()).toContain("Reconnexion");
  });
});
```

- [ ] **Step 2 : Écrire le test VisitsPanel**

```typescript
// frontend/src/components/molecules/VisitsPanel/VisitsPanel.spec.ts
import { mount } from "@vue/test-utils";
import { describe, it, expect } from "vitest";
import VisitsPanel from "./VisitsPanel.vue";

describe("VisitsPanel", () => {
  it("affiche le total quand défini", () => {
    const wrapper = mount(VisitsPanel, {
      props: {
        total24h: 1240,
        topApps: [{ name: "portfolio", visits: 540 }],
      },
    });
    expect(wrapper.text()).toContain("1240");
  });

  it("affiche — quand total24h est null", () => {
    const wrapper = mount(VisitsPanel, {
      props: { total24h: null, topApps: [] },
    });
    expect(wrapper.text()).toContain("—");
  });

  it("affiche la liste des top apps", () => {
    const wrapper = mount(VisitsPanel, {
      props: {
        total24h: 1000,
        topApps: [
          { name: "portfolio", visits: 540 },
          { name: "api", visits: 310 },
        ],
      },
    });
    expect(wrapper.text()).toContain("portfolio");
    expect(wrapper.text()).toContain("api");
    expect(wrapper.text()).toContain("540");
  });
});
```

- [ ] **Step 3 : Lancer pour vérifier l'échec**

```bash
cd frontend && npm run test:unit
```

Expected: FAIL sur MetricCard et VisitsPanel

- [ ] **Step 4 : Implémenter MetricCard.vue**

```vue
<!-- frontend/src/components/molecules/MetricCard/MetricCard.vue -->
<script setup lang="ts">
import GaugeCircle from "@/components/atoms/GaugeCircle/GaugeCircle.vue";
import type { SseStatus } from "@/stores/metrics.store";

defineProps<{
  title: string;
  value: number;
  sublabel: string;
  status?: SseStatus;
}>();
</script>

<template>
  <div class="metric-card glass-card">
    <div class="metric-card__header">
      <span class="metric-card__title font-display">{{ title }}</span>
      <span
        v-if="status && status !== 'connected'"
        class="metric-card__status"
        :class="`metric-card__status--${status}`"
      >
        {{ status === "reconnecting" ? "Reconnexion" : status === "connecting" ? "Connexion..." : "Erreur" }}
      </span>
      <span v-else class="metric-card__dot" />
    </div>
    <GaugeCircle :value="value" :label="title" :sublabel="sublabel" />
  </div>
</template>

<style scoped>
.metric-card {
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.metric-card__header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.metric-card__title {
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.metric-card__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-emerald);
  animation: pulse-neon 2s ease-in-out infinite;
}

.metric-card__status {
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 999px;
}

.metric-card__status--reconnecting,
.metric-card__status--connecting {
  background: var(--color-amber-dim);
  color: var(--color-amber);
}

.metric-card__status--error {
  background: var(--color-error-dim);
  color: var(--color-error);
}
</style>
```

- [ ] **Step 5 : Implémenter VisitsPanel.vue**

```vue
<!-- frontend/src/components/molecules/VisitsPanel/VisitsPanel.vue -->
<script setup lang="ts">
import type { TopApp } from "@/services/metrics.service";

defineProps<{
  total24h: number | null;
  topApps: TopApp[];
}>();
</script>

<template>
  <div class="visits-panel glass-card">
    <div class="visits-panel__section">
      <p class="visits-panel__label font-display">Visites 24h</p>
      <p class="visits-panel__total neon-text-emerald font-display">
        {{ total24h !== null ? total24h.toLocaleString() : "—" }}
      </p>
    </div>

    <div class="visits-panel__divider" />

    <div class="visits-panel__section">
      <p class="visits-panel__label font-display">Top apps</p>
      <div v-if="topApps.length" class="visits-panel__apps">
        <div
          v-for="app in topApps"
          :key="app.name"
          class="visits-panel__app-row"
        >
          <span class="visits-panel__app-name">{{ app.name }}</span>
          <span class="visits-panel__app-count">{{ app.visits.toLocaleString() }}</span>
        </div>
      </div>
      <p v-else class="visits-panel__empty">Données indisponibles</p>
    </div>
  </div>
</template>

<style scoped>
.visits-panel {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.visits-panel__section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.visits-panel__label {
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  margin: 0;
}

.visits-panel__total {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  line-height: 1;
}

.visits-panel__divider {
  height: 1px;
  background: var(--color-border);
}

.visits-panel__apps {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.visits-panel__app-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.visits-panel__app-name {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  font-family: var(--font-display);
}

.visits-panel__app-count {
  font-size: 0.875rem;
  color: var(--color-navy-light);
  font-weight: 600;
}

.visits-panel__empty {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  margin: 0;
}
</style>
```

- [ ] **Step 6 : Lancer les tests**

```bash
cd frontend && npm run test:unit
```

Expected: tous les tests passent (maintenant 30+ passing)

- [ ] **Step 7 : Commit**

```bash
git add frontend/src/components/molecules/MetricCard/ frontend/src/components/molecules/VisitsPanel/
git commit -m "feat(DASH-5/6): molecules MetricCard et VisitsPanel"
```

---

## Task 11 : DashboardPage — réécriture complète

**Files:**
- Modify: `frontend/src/components/pages/DashboardPage/DashboardPage.vue`

- [ ] **Step 1 : Réécrire DashboardPage.vue**

```vue
<!-- frontend/src/components/pages/DashboardPage/DashboardPage.vue -->
<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import LineChart from "@/components/atoms/LineChart/LineChart.vue";
import MetricCard from "@/components/molecules/MetricCard/MetricCard.vue";
import VisitsPanel from "@/components/molecules/VisitsPanel/VisitsPanel.vue";
import {
  connectLive,
  fetchHistory,
  fetchVisits,
  type HistoryRange,
} from "@/services/metrics.service";
import { useMetricsStore } from "@/stores/metrics.store";

const store = useMetricsStore();
const historyLoading = ref(false);
let disconnectLive: (() => void) | null = null;

async function loadHistory(range: HistoryRange) {
  historyLoading.value = true;
  const data = await fetchHistory(range);
  store.setHistory(range, data);
  historyLoading.value = false;
}

onMounted(async () => {
  disconnectLive = connectLive(
    (metrics) => store.setLive(metrics),
    (status) => store.setSseStatus(status),
  );
  const [, visits] = await Promise.all([
    loadHistory("1h"),
    fetchVisits(),
  ]);
  store.setVisits(visits);
});

onUnmounted(() => {
  disconnectLive?.();
});
</script>

<template>
  <div class="dashboard-page">
    <div class="dashboard-page__inner">
      <div class="dashboard-page__grid">
        <!-- Colonne gauche : métriques live -->
        <div class="dashboard-page__metrics">
          <MetricCard
            title="CPU"
            :value="store.cpu"
            sublabel="utilisation"
            :status="store.sseStatus"
          />
          <MetricCard
            title="RAM"
            :value="store.ramTotal > 0 ? Math.round((store.ramUsed / store.ramTotal) * 100) : 0"
            :sublabel="`${store.ramUsed} / ${store.ramTotal} MB`"
            :status="store.sseStatus"
          />
        </div>

        <!-- Colonne droite : visites -->
        <VisitsPanel
          :total24h="store.total24h"
          :top-apps="store.topApps"
        />
      </div>

      <!-- Graphe historique pleine largeur -->
      <div class="dashboard-page__history glass-card">
        <div class="dashboard-page__history-header">
          <span class="dashboard-page__history-title font-display">Historique</span>
          <div class="dashboard-page__range-btns">
            <button
              v-for="r in (['1h', '24h', '7d'] as HistoryRange[])"
              :key="r"
              class="dashboard-page__range-btn"
              :class="{ 'dashboard-page__range-btn--active': store.historyRange === r }"
              @click="loadHistory(r)"
            >
              {{ r }}
            </button>
          </div>
        </div>
        <LineChart
          :cpu-data="store.historyCpu"
          :ram-data="store.historyRam"
          :loading="historyLoading"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-page {
  min-height: calc(100vh - 56px);
  padding: 32px 24px;
}

.dashboard-page__inner {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.dashboard-page__grid {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 16px;
}

.dashboard-page__metrics {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dashboard-page__history {
  padding: 20px;
}

.dashboard-page__history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.dashboard-page__history-title {
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.dashboard-page__range-btns {
  display: flex;
  gap: 4px;
}

.dashboard-page__range-btn {
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-secondary);
  font-family: var(--font-display);
  font-size: 0.75rem;
  cursor: pointer;
  transition: background-color var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast);
}

.dashboard-page__range-btn:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

.dashboard-page__range-btn--active {
  background: var(--color-emerald-dim);
  border-color: var(--color-border-accent);
  color: var(--color-emerald);
}

@media (max-width: 640px) {
  .dashboard-page__grid {
    grid-template-columns: 1fr;
  }
}
</style>
```

- [ ] **Step 2 : Vérifier le type-check**

```bash
cd frontend && npm run type-check
```

Expected: 0 erreur

- [ ] **Step 3 : Lancer les tests unitaires**

```bash
cd frontend && npm run test:unit
```

Expected: tous les tests passent

- [ ] **Step 4 : Commit**

```bash
git add frontend/src/components/pages/DashboardPage/DashboardPage.vue
git commit -m "feat(DASH-5/6): DashboardPage — métriques live SSE + historique + visites"
```

---

## Task 12 : Test E2E dashboard

**Files:**
- Create: `frontend/e2e/dashboard.spec.ts`

- [ ] **Step 1 : Créer le test E2E**

```typescript
// frontend/e2e/dashboard.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Dashboard — métriques", () => {
  test.beforeEach(async ({ page }) => {
    // Mock l'auth status comme connected
    await page.route("**/api/v1/auth/status", (route) =>
      route.fulfill({ json: { status: "connected" } }),
    );
    // Mock les métriques live (SSE)
    await page.route("**/api/v1/metrics/live", (route) => {
      route.fulfill({
        status: 200,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
        },
        body: 'data: {"cpu":42.3,"ram":{"used":3891,"total":8192}}\n\n',
      });
    });
    // Mock l'historique
    await page.route("**/api/v1/metrics/history**", (route) =>
      route.fulfill({ json: { cpu: [], ram: [] } }),
    );
    // Mock les visites
    await page.route("**/api/v1/visits", (route) =>
      route.fulfill({
        json: {
          total24h: 1240,
          topApps: [
            { name: "portfolio", visits: 540 },
            { name: "api", visits: 310 },
          ],
        },
      }),
    );
  });

  test("affiche les sections métriques et visites", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator("text=CPU")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=RAM")).toBeVisible();
    await expect(page.locator("text=Visites 24h")).toBeVisible();
  });

  test("affiche le total des visites", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator("text=1 240")).toBeVisible({ timeout: 5000 });
  });

  test("affiche les top apps", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator("text=portfolio")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=api")).toBeVisible();
  });

  test("les boutons de plage temporelle sont présents", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator("button:has-text('1h')")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("button:has-text('24h')")).toBeVisible();
    await expect(page.locator("button:has-text('7d')")).toBeVisible();
  });
});
```

- [ ] **Step 2 : Lancer les tests E2E**

```bash
cd frontend && npx playwright test e2e/dashboard.spec.ts --project=chromium
```

Expected: 4 tests passing (ou skip gracieux si backend non disponible)

- [ ] **Step 3 : Commit final**

```bash
git add frontend/e2e/dashboard.spec.ts
git commit -m "test(DASH-5/6): tests E2E page dashboard avec mocks SSE et API"
```

---

## Checklist finale

- [ ] `cd backend && npm test` — tous les tests backend passent
- [ ] `cd frontend && npm run test:unit` — tous les tests unitaires frontend passent
- [ ] `cd frontend && npx playwright test --project=chromium` — tests E2E passent
- [ ] `cd backend && npx tsc --noEmit` — 0 erreur TypeScript backend
- [ ] `cd frontend && npm run type-check` — 0 erreur TypeScript frontend
