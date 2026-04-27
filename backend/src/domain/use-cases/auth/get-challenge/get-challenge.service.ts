import { AppError } from '@errors/app.error'
import type { PasskeyEntity } from '@entities'
import { generateAuthenticationOptions } from '@simplewebauthn/server'
import { rpID } from '../../../entities/rp.class'
import { storeChallenge } from '../challenge.store'

export async function generateChallenge(
	accountId: string,
	passkey: PasskeyEntity,
): Promise<PublicKeyCredentialRequestOptionsJSON> {
	if (!passkey.credentialId) {
		throw new AppError('invalid-payload', 'No passkey registered')
	}

	const options = await generateAuthenticationOptions({
		rpID,
		allowCredentials: [{ id: passkey.credentialId }],
		userVerification: 'preferred',
	})

	storeChallenge(options.challenge, accountId)
	return options
}
