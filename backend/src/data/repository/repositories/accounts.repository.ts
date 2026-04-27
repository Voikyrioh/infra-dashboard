import type { AccountEntity, PasskeyEntity } from '@entities'
import { resources } from '../../database/postgres'
import { assertAndCoerceAccountModelToEntity } from './dao/account.dao'
import { assertAndCoercePasskeyModelToEntity } from './dao/passkey.dao'

export class AccountsRepository {
	async getOwnerInformations(): Promise<{
		account: AccountEntity
		passkey?: PasskeyEntity
	}> {
		const account = await resources.accounts.getAccountByName('owner')
		const passkey = await resources.passkeys.getPasskeyForAccount(account.id)

		return {
			account: assertAndCoerceAccountModelToEntity(account),
			passkey: passkey
				? assertAndCoercePasskeyModelToEntity(passkey)
				: undefined,
		}
	}
}
