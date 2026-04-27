import { Hono } from 'hono'
import { requireAuth } from '../middleware/require-auth'
import { GetVisits } from '../../domain/use-cases/visits/get-visits/get-visits.use-case'

const visitsRoute = new Hono().basePath('/visits')

visitsRoute.use('*', requireAuth)

visitsRoute.get('/', async (c) => {
	return c.json(await GetVisits.Execute())
})

export default visitsRoute
