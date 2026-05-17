import { Hono } from 'hono'
import { z } from 'zod/v4'
import { customZod } from '@libraries'
import { requireAuth } from '../middleware/require-auth'
import { SyncApps } from '../../domain/use-cases/apps/sync-apps/sync-apps.use-case'
import { GetApps } from '../../domain/use-cases/apps/get-apps/get-apps.use-case'
import { GetApp } from '../../domain/use-cases/apps/get-app/get-app.use-case'
import {
	ConfigureApp,
	configureAppSchema,
} from '../../domain/use-cases/apps/configure-app/configure-app.use-case'
import { GetAppVersions } from '../../domain/use-cases/apps/get-app-versions/get-app-versions.use-case'
import {
	DeployVersion,
	deployVersionSchema,
} from '../../domain/use-cases/apps/deploy-version/deploy-version.use-case'
import { getContainerStats } from '../../domain/use-cases/apps/get-app-stats/get-app-stats.service'
import {
	fetchInfraConfig,
	commitInfraConfig,
} from '../../domain/use-cases/apps/get-infra-config/get-infra-config.service'
import { fetchLokiLogs, fetchDockerFileLogs } from '../../domain/use-cases/apps/get-app-logs/get-app-logs.service'
import { AppError } from '@errors/app.error'
import { repository } from '../../data/repository/factory'

const appsRoute = new Hono().basePath('/apps')

appsRoute.use('*', requireAuth)

appsRoute.post('/sync', async (c) => {
	const apps = await SyncApps.Execute()
	return c.json(apps)
})

appsRoute.get('/', async (c) => {
	const apps = await GetApps.Execute()
	return c.json(apps)
})

appsRoute.put(
	'/:id',
	customZod.customValidator('json', configureAppSchema),
	async (c) => {
		const { id } = c.req.param()
		const data = c.req.valid('json')
		const app = await ConfigureApp.Execute(id, data)
		return c.json(app)
	},
)

appsRoute.get('/:id/versions', async (c) => {
	const { id } = c.req.param()
	const versions = await GetAppVersions.Execute(id)
	return c.json(versions)
})

appsRoute.post(
	'/:id/deploy',
	customZod.customValidator('json', deployVersionSchema),
	async (c) => {
		const { id } = c.req.param()
		const { version } = c.req.valid('json')
		await DeployVersion.Execute(id, version)
		return c.body(null, 204)
	},
)

appsRoute.get('/:id', async (c) => {
	const { id } = c.req.param()
	const app = await GetApp.Execute(id)
	return c.json(app)
})

appsRoute.get('/:id/stats', async (c) => {
	const { id } = c.req.param()
	const app = await GetApp.Execute(id)
	if (!app.containerName) return c.json(null)
	const stats = await getContainerStats(app.containerName)
	return c.json(stats)
})

const updateInfraConfigSchema = z.object({
	env: z.record(z.string(), z.string()),
})

appsRoute.get('/:id/infra-config', async (c) => {
	const { id } = c.req.param()
	const app = await GetApp.Execute(id)
	if (!app.appName) throw new AppError('not-found', 'App not provisioned in infra')
	const config = await fetchInfraConfig(app.appName)
	return c.json({ env: config.env, logFile: config.logFile })
})

appsRoute.put(
	'/:id/infra-config',
	customZod.customValidator('json', updateInfraConfigSchema),
	async (c) => {
		const { id } = c.req.param()
		const { env } = c.req.valid('json')
		const app = await GetApp.Execute(id)
		if (!app.appName) throw new AppError('not-found', 'App not provisioned in infra')
		await commitInfraConfig(app.appName, env)
		return c.body(null, 204)
	},
)

const autoDeploySchema = z.object({ enabled: z.boolean() })

appsRoute.put(
	'/:id/auto-deploy',
	customZod.customValidator('json', autoDeploySchema),
	async (c) => {
		const { id } = c.req.param()
		const { enabled } = c.req.valid('json')
		await repository.apps.setAutoDeployEnabled(id, enabled)
		return c.body(null, 204)
	},
)

appsRoute.get('/:id/logs', async (c) => {
	const { id } = c.req.param()
	const source = c.req.query('source') ?? 'loki'
	const limit = Math.min(parseInt(c.req.query('limit') ?? '200', 10), 500)
	const app = await GetApp.Execute(id)
	if (!app.containerName) return c.json([])

	if (source === 'file') {
		const infraConfig = app.appName ? await fetchInfraConfig(app.appName).catch(() => null) : null
		const logFile = infraConfig?.logFile ?? null
		if (!logFile) return c.json([])
		const logs = await fetchDockerFileLogs(app.containerName, logFile, limit)
		return c.json(logs)
	}

	const logs = await fetchLokiLogs(app.containerName, limit)
	return c.json(logs)
})

export default appsRoute
