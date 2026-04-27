import Config from '@config'
import { AppError } from '@errors/app.error'
import type { PasskeyEntity } from '@entities'
import {
	type AuthenticationResponseJSON,
	type AuthenticatorTransportFuture,
	verifyAuthenticationResponse,
} from '@simplewebauthn/server'
import { sign } from 'hono/jwt'
import { repository } from '../../../../data/repository/factory'
import { origin, rpID } from '../../../entities/rp.class'
import { consumeChallenge } from '../challenge.store'

export async function verifyPasskeyAuth(
	authResponse: AuthenticationResponseJSON,
): Promise<{ passkey: PasskeyEntity; newCounter: number }> {
	const passkey = await repository.passkeys.findByCredentialId(authResponse.id)

	const result = await verifyAuthenticationResponse({
		response: authResponse,
		expectedChallenge: (challenge) => {
			const stored = consumeChallenge(challenge)
			return stored !== null
		},
		expectedOrigin: origin,
		expectedRPID: rpID,
		credential: {
			id: passkey.credentialId,
			publicKey: new Uint8Array(passkey.publicKey.map((b) => (b < 0 ? b + 256 : b))),
			counter: Number(passkey.counter),
			transports: passkey.transports as AuthenticatorTransportFuture[],
		},
	})

	if (!result.verified) {
		throw new AppError('unauthorized', 'Authentication failed')
	}

	return { passkey, newCounter: result.authenticationInfo.newCounter }
}

export async function updatePasskeyCounter(
	credentialId: string,
	counter: number,
): Promise<void> {
	await repository.passkeys.updateCounter(credentialId, counter)
}

export async function generateToken(accountId: string): Promise<string> {
	const now = Math.floor(Date.now() / 1000)
	const exp = now + Math.floor(Config.Server.JwtExpiresMs / 1000)
	return sign(
		{ sub: accountId, role: 'owner', iat: now, exp },
		Config.Server.SigningKey,
		'HS256',
	)
}
