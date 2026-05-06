import { Hono } from 'hono'
import { customZod } from '@libraries'
import { requireAuth } from '../middleware/require-auth'
import { SyncApps } from '../../domain/use-cases/apps/sync-apps/sync-apps.use-case'
import { GetApps } from '../../domain/use-cases/apps/get-apps/get-apps.use-case'
import {
	ConfigureApp,
	configureAppSchema,
} from '../../domain/use-cases/apps/configure-app/configure-app.use-case'
import { GetAppVersions } from '../../domain/use-cases/apps/get-app-versions/get-app-versions.use-case'
import {
	DeployVersion,
	deployVersionSchema,
} from '../../domain/use-cases/apps/deploy-version/deploy-version.use-case'

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

export default appsRoute
