// backend/src/entry-points/middleware/require-auth.ts
import { AppError } from '@errors/app.error'
import { getCookie } from 'hono/cookie'
import type { MiddlewareHandler } from 'hono'
import { checkJwtCookie } from '../../domain/use-cases/auth/get-auth/get-auth-status.service'

export const requireAuth: MiddlewareHandler = async (c, next) => {
	const token = getCookie(c, 'jwt')
	if (!token) throw new AppError('unauthorized', 'Authentication required')
	const valid = await checkJwtCookie(token)
	if (!valid) throw new AppError('unauthorized', 'Invalid or expired session')
	await next()
}
