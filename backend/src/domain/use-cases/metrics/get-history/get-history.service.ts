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
