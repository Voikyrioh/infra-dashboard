import { type PasskeyEntity, PasskeySchema } from '@entities'
import { AppError } from '@errors/app.error'
import logger from '@logger'
import type { PasskeyModel } from '../../../database/postgres/models/passkey.model'

export const assertAndCoercePasskeyModelToEntity = (
	passkey: PasskeyModel,
): PasskeyEntity => {
	const publicKeyBuffer = passkey.public_key as Buffer
	const entityParse = PasskeySchema.safeParse({
		credentialId: passkey.credential_id,
		publicKey: Array.from(publicKeyBuffer).map((b) => (b > 127 ? b - 256 : b)),
		accountId: passkey.account_id,
		webauthnUserID: passkey.webauthn_user_id,
		counter: BigInt(passkey.counter),
		deviceType: passkey.backed_eligible ? 'multiDevice' : 'singleDevice',
		backedUp: passkey.backed_up,
		transports: passkey.transports.split('|').filter(Boolean),
	})

	if (!entityParse.success) {
		logger.error(entityParse.error.message)
		throw new AppError('internal-server-error', 'Internal server error')
	}

	return entityParse.data
}
