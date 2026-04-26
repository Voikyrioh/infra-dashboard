import { AccountsRepository } from './repositories/accounts.repository'
import { PasskeysRepository } from './repositories/passkey.repository'

class RepositoryFactory {
	readonly accounts: AccountsRepository
	readonly passkeys: PasskeysRepository

	constructor() {
		this.accounts = new AccountsRepository()
		this.passkeys = new PasskeysRepository()
	}
}

export const repository = Object.freeze(new RepositoryFactory())
