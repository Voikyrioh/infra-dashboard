import { Hono } from 'hono'
import { customZod } from '@libraries'
import { requireAuth } from '../middleware/require-auth'
import { GetTags } from '../../domain/use-cases/apps/get-tags/get-tags.use-case'
import {
	CreateTag,
	createTagSchema,
} from '../../domain/use-cases/apps/create-tag/create-tag.use-case'

const tagsRoute = new Hono().basePath('/tags')

tagsRoute.use('*', requireAuth)

tagsRoute.get('/', async (c) => {
	const tags = await GetTags.Execute()
	return c.json(tags)
})

tagsRoute.post('/', customZod.customValidator('json', createTagSchema), async (c) => {
	const data = c.req.valid('json')
	const tag = await CreateTag.Execute(data)
	return c.json(tag, 201)
})

export default tagsRoute
