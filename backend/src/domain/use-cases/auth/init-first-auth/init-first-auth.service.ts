import Config from '@config'
import { AppError } from '@errors/app.error'
import {
	type RegistrationResponseJSON,
	type VerifiedRegistrationResponse,
	verifyRegistrationResponse,
} from '@simplewebauthn/server'
import { sign } from 'hono/jwt'
import { repository } from '../../../../data/repository/factory'
import { origin, rpID } from '../../../entities/rp.class'
import { consumeChallenge } from '../challenge.store'
import { getOwner, parseStatus } from '../get-auth/get-auth-status.service'

export type VerifiedRegistrationInfo = NonNullable<
	Extract<VerifiedRegistrationResponse, { verified: true }>['registrationInfo']
>

export async function assertNeedsFirstAuth() {
	const { account, passkey } = await getOwner()
	const status = parseStatus(passkey)
	if (status !== 'need-first-auth') {
		throw new AppError('invalid-payload', 'Owner is already configured')
	}
	return account
}

export function verifyInitPassword(password: string) {
	if (password !== Config.Server.InitPassword) {
		throw new AppError('unauthorized', 'Invalid initialization password')
	}
}

export async function verifyPasskeyRegistration(
	registrationResponse: RegistrationResponseJSON,
): Promise<{
	registrationInfo: VerifiedRegistrationInfo
	webauthnUserID: string
}> {
	let webauthnUserID: string | null = null

	const result = await verifyRegistrationResponse({
		response: registrationResponse,
		expectedChallenge: (challenge) => {
			const stored = consumeChallenge(challenge)
			if (!stored) return false
			webauthnUserID = stored.webauthnUserID
			return true
		},
		expectedOrigin: origin,
		expectedRPID: rpID,
		requireUserVerification: true,
	})

	if (!result.verified || !result.registrationInfo || !webauthnUserID) {
		throw new AppError('invalid-payload', 'Passkey verification failed')
	}

	return {
		registrationInfo: result.registrationInfo,
		webauthnUserID,
	}
}

export async function savePasskey(
	accountId: string,
	registrationInfo: VerifiedRegistrationInfo,
	webauthnUserID: string,
	ip: string,
) {
	await repository.passkeys.savePasskey(
		accountId,
		registrationInfo,
		webauthnUserID,
		ip,
	)
}

export async function generateToken(accountId: string) {
	const now = Math.floor(Date.now() / 1000)
	const exp = now + Math.floor(Config.Server.JwtExpiresMs / 1000)
	return sign(
		{ sub: accountId, role: 'owner', iat: now, exp },
		Config.Server.SigningKey,
	)
}
