import { type PasskeyEntity, PasskeySchema } from '@entities'
import { AppError } from '@errors/app.error'
import logger from '@logger'
import type { PasskeyModel } from '../../../database/postgres/models/passkey.model'

export const assertAndCoercePasskeyModelToEntity = (
	passkey: PasskeyModel,
): PasskeyEntity => {
	const entityParse = PasskeySchema.safeParse({
		id: passkey.id,
		publicKey: passkey.public_key,
		user: passkey.account_id,
		webauthnUserId: passkey.webauthn_user_id,
		counter: passkey.counter,
		deviceType: 'singleDevice',
		backedUp: passkey.backed_up,
		transports: passkey.transports.replace(/[[\]']/g, '').split('|'),
	})

	if (!entityParse.success) {
		logger.error(entityParse.error.message)
		throw new AppError('internal-server-error', 'Internal server error')
	}

	return entityParse.data
}
