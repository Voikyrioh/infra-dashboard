import { AppError } from '@errors/app.error'
import { client as pg } from '../client'
import type { AccountModel } from '../models/account.model'

class AccountsResource {
	async getAccountById(id: string) {
		const [account] = await pg.sql<
			AccountModel[]
		>`SELECT * FROM accounts WHERE id = ${id} LIMIT 1`

		if (!account) throw new AppError('not-found', 'Account does not exist')

		return account
	}

	async getAccountByName(name: string) {
		const [account] = await pg.sql<
			AccountModel[]
		>`SELECT * FROM accounts WHERE name = ${name} LIMIT 1`

		if (!account) throw new AppError('not-found', 'Account does not exist')

		return account ?? null
	}
}

export default Object.freeze(new AccountsResource())
