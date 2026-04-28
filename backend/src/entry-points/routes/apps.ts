import { Hono } from 'hono'
import { customZod } from '@libraries'
import { requireAuth } from '../middleware/require-auth'
import { SyncApps } from '../../domain/use-cases/apps/sync-apps/sync-apps.use-case'
import { GetApps } from '../../domain/use-cases/apps/get-apps/get-apps.use-case'
import {
	ConfigureApp,
	configureAppSchema,
} from '../../domain/use-cases/apps/configure-app/configure-app.use-case'

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

export default appsRoute
