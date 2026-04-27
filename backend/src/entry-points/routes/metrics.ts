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
