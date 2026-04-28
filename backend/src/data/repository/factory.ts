import { AccountsRepository } from './repositories/accounts.repository'
import { PasskeysRepository } from './repositories/passkey.repository'
import { AppsRepository } from './repositories/apps.repository'
import { TagsRepository } from './repositories/tags.repository'

class RepositoryFactory {
	readonly accounts: AccountsRepository
	readonly passkeys: PasskeysRepository
	readonly apps: AppsRepository
	readonly tags: TagsRepository

	constructor() {
		this.accounts = new AccountsRepository()
		this.passkeys = new PasskeysRepository()
		this.apps = new AppsRepository()
		this.tags = new TagsRepository()
	}
}

export const repository = Object.freeze(new RepositoryFactory())
