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

// GET /api/v1/query_range SigNoz = format Prometheus (status/data/result/values),
// identique à l'ancien Victoria Metrics.
interface PromRangeResponse {
	status: string
	data: { resultType: string; result: { metric: object; values: [number, string][] }[] }
}

export function parsePromResponse(response: PromRangeResponse): DataPoint[] {
	const result = response.data.result[0]
	if (!result) return []
	return result.values.map(([t, v]) => ({ t, v: parseFloat(v) }))
}

const RANGE_PARAMS: Record<HistoryRange, { step: string; offsetSeconds: number }> = {
	'1h':  { step: '30s',  offsetSeconds: 3600 },
	'24h': { step: '5m',   offsetSeconds: 86400 },
	'7d':  { step: '1h',   offsetSeconds: 604800 },
}

async function querySignoz(query: string, range: HistoryRange): Promise<DataPoint[]> {
	const baseUrl = Config.Server.SignozApiUrl
	const apiKey = Config.Server.SignozApiKey
	if (!baseUrl || !apiKey) return []

	const now = Math.floor(Date.now() / 1000)
	const { step, offsetSeconds } = RANGE_PARAMS[range]
	const params = new URLSearchParams({
		query,
		start: String(now - offsetSeconds),
		end: String(now),
		step,
	})

	try {
		const res = await fetch(`${baseUrl}/api/v1/query_range?${params}`, {
			headers: { 'SIGNOZ-API-KEY': apiKey },
		})
		if (!res.ok) return []
		const data: PromRangeResponse = await res.json()
		return parsePromResponse(data)
	} catch {
		return []
	}
}

export async function fetchHistory(range: HistoryRange): Promise<HistoryMetrics> {
	const CPU_QUERY = `100 * (1 - avg(rate(node_cpu_seconds_total{mode="idle"}[5m])))`
	// sum() obligatoire : SigNoz colle des labels internes (__scope.name__,
	// __temporality__…) aux séries prometheus → le vector matching de la
	// soustraction brute ne matche jamais (result vide, constaté live).
	const RAM_QUERY = `(sum(node_memory_MemTotal_bytes) - sum(node_memory_MemAvailable_bytes)) / 1048576`

	const [cpu, ram] = await Promise.all([
		querySignoz(CPU_QUERY, range),
		querySignoz(RAM_QUERY, range),
	])
	return { cpu, ram }
}
