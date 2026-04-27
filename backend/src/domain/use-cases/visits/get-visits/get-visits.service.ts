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
	data: {
		resultType: string
		result: Array<{
			metric: Record<string, string>
			value: [number | string, string]
		}>
	}
}

export function parseLokiTopApps(response: LokiResponse): TopApp[] {
	return response.data.result.map((r) => ({
		name: r.metric.app ?? 'unknown',
		visits: Math.max(0, parseInt(r.value[1], 10) || 0),
	}))
}

let visitsCache: { data: VisitsData; expiresAt: number } | null = null
const CACHE_TTL_MS = 5 * 60 * 1000

export async function fetchGlobalVisits(): Promise<number | null> {
	const token = Config.Server.CfApiToken
	const zoneId = Config.Server.CfZoneId
	if (!token || !zoneId) return null

	try {
		const res = await fetch(
			`https://api.cloudflare.com/client/v4/zones/${zoneId}/analytics/dashboard?since=-1440&until=0`,
			{ headers: { Authorization: `Bearer ${token}` } },
		)
		if (!res.ok) return null

		const data = await res.json()
		return data?.result?.totals?.uniques?.all ?? null
	} catch {
		return null
	}
}

export async function fetchTopApps(): Promise<TopApp[]> {
	const lokiUrl = Config.Server.LokiUrl
	if (!lokiUrl) return []

	try {
		const query = encodeURIComponent(
			`topk(3, sum by (app) (count_over_time({job="traefik"}[24h])))`,
		)
		const res = await fetch(`${lokiUrl}/loki/api/v1/query?query=${query}`)
		if (!res.ok) return []

		const data: LokiResponse = await res.json()
		return parseLokiTopApps(data)
	} catch {
		return []
	}
}

export async function fetchVisits(): Promise<VisitsData> {
	if (visitsCache && visitsCache.expiresAt > Date.now()) {
		return visitsCache.data
	}
	const [total24h, topApps] = await Promise.all([
		fetchGlobalVisits(),
		fetchTopApps(),
	])
	const result: VisitsData = { total24h, topApps }
	visitsCache = { data: result, expiresAt: Date.now() + CACHE_TTL_MS }
	return result
}
