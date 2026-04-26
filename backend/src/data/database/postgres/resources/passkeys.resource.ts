import { AppError } from '@errors/app.error'
import logger from '@logger'
import { client as pg } from '../client'
import type { PasskeyModel } from '../models/passkey.model'

class PasskeyResource {
	async getPasskeyById(id: string) {
		const [account] = await pg.sql<
			PasskeyModel[]
		>`SELECT * FROM passkeys WHERE id = ${id} LIMIT 1`

		if (!account) throw new AppError('not-found', 'Account does not exist')

		return account
	}

	async getAccountByPasskey(name: string) {
		const [account] = await pg.sql<
			PasskeyModel[]
		>`SELECT * FROM passkeys WHERE name = ${name} LIMIT 1`

		if (!account) throw new AppError('not-found', 'Account does not exist')

		return account ?? null
	}

	async addPasskeyAccount(account: Omit<PasskeyModel, 'id'>) {
		await pg.sql`INSERT INTO passkeys (public_key, account_id, webauthn_user_id, counter, backed_eligible, backed_up, transports, created_at, last_login, last_ip) VALUES (${account.public_key}, ${account.account_id}, ${account.webauthn_user_id}, ${account.counter}, ${account.backed_eligible}, ${account.backed_up}, ${account.transports}, ${account.created_at}, ${account.last_login}, ${account.last_ip})`.catch(
			(err) => {
				logger.info(err)
				throw new AppError(
					'internal-server-error',
					'Failed to add passkey account',
					err,
				)
			},
		)
	}

	async getPasskeyForAccount(id: string) {
		const [passkey] = await pg.sql<
			PasskeyModel[]
		>`SELECT * FROM passkeys WHERE account_id = ${id} LIMIT 1`

		return passkey ?? null
	}
}

export default Object.freeze(new PasskeyResource())
