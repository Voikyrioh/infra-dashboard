import { createHmac, timingSafeEqual } from 'node:crypto'
import { Hono } from 'hono'
import Config from '@config'
import { repository } from '../../data/repository/factory'
import { DeployVersion } from '../../domain/use-cases/apps/deploy-version/deploy-version.use-case'
import logger from '@logger'

const webhooksRoute = new Hono().basePath('/webhooks')

async function verifyGitHubSignature(body: string, signature: string | undefined): Promise<boolean> {
	const secret = Config.Server.GitHubWebhookSecret
	if (!secret) return false
	if (!signature?.startsWith('sha256=')) return false

	const expected = createHmac('sha256', secret).update(body).digest('hex')
	const expectedBuf = Buffer.from(`sha256=${expected}`)
	const sigBuf = Buffer.from(signature)

	if (expectedBuf.length !== sigBuf.length) return false
	return timingSafeEqual(expectedBuf, sigBuf)
}

webhooksRoute.post('/github', async (c) => {
	const rawBody = await c.req.text()
	const signature = c.req.header('x-hub-signature-256')
	const eventType = c.req.header('x-github-event')

	const valid = await verifyGitHubSignature(rawBody, signature)
	if (!valid) return c.body(null, 401)

	if (eventType !== 'release') return c.body(null, 204)

	let payload: any
	try {
		payload = JSON.parse(rawBody)
	} catch {
		return c.body(null, 400)
	}

	if (payload.action !== 'published') return c.body(null, 204)

	const repoFullName: string = payload?.repository?.full_name ?? ''
	const tagName: string = payload?.release?.tag_name ?? ''

	if (!repoFullName || !tagName) return c.body(null, 204)
	if (!/^v\d+\.\d+\.\d+$/.test(tagName)) return c.body(null, 204)

	const app = await repository.apps.findByRepoFullName(repoFullName)
	if (!app || !app.autoDeployEnabled) return c.body(null, 204)

	logger.info(`Auto-deploy triggered for ${repoFullName} @ ${tagName}`)

	DeployVersion.Execute(app.id, tagName).catch((err) => {
		logger.error(`Auto-deploy failed for ${repoFullName}: ${err}`)
	})

	return c.body(null, 200)
})

export default webhooksRoute
