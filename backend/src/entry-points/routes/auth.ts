import { customZod } from '@libraries'
import type { RegistrationResponseJSON } from '@simplewebauthn/server'
import { Hono } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { z } from 'zod'
import { GetAuthStatus, InitFirstAuth } from '../../domain/use-cases'

const registrationResponseSchema = z.object({
	id: z.base64url(),
	rawId: z.base64url(),
	type: z.literal('public-key'),
	response: z.object({
		clientDataJSON: z.base64url(),
		attestationObject: z.base64url(),
		transports: z.array(z.string()).optional(),
	}),
	clientExtensionResults: z.record(z.string(), z.unknown()).optional(),
})

const initFirstAuthSchema = z.object({
	password: z.string().min(1),
	registrationResponse: registrationResponseSchema,
})

const authRoute = new Hono().basePath('/auth')

authRoute.get('status', async (c) => {
	const jwtCookie = getCookie(c, 'jwt')
	return c.json(await GetAuthStatus.Execute(jwtCookie))
})

authRoute.put(
	'/',
	customZod.customValidator('json', initFirstAuthSchema),
	async (c) => {
		const { password, registrationResponse } = c.req.valid('json')
		const ip = c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip') ?? 'unknown'
		const { token } = await InitFirstAuth.Execute(
			password,
			registrationResponse as RegistrationResponseJSON,
			ip,
		)
		setCookie(c, 'jwt', token, {
			httpOnly: true,
			secure: true,
			sameSite: 'Strict',
			path: '/',
		})
		return c.json({ success: true })
	},
)

authRoute.delete('/', async (c) => {
	deleteCookie(c, 'jwt', { path: '/' })
	return c.json({ success: true })
})

export default authRoute
