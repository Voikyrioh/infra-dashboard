import { type AccountEntity, accountSchema } from '@entities'
import { AppError } from '@errors/app.error'
import logger from '@logger'
import type { AccountModel } from '../../../database/postgres/models/account.model'

const accountModelRoleMap: Record<number, AccountEntity['role']> = {
	0: 'owner',
	1: 'user',
}

export const assertAndCoerceAccountModelToEntity = (
	account: AccountModel,
): AccountEntity => {
	const entityParse = accountSchema.safeParse({
		id: account.id,
		name: account.name,
		role: accountModelRoleMap[account.role],
	})

	if (!entityParse.success) {
		logger.error(entityParse.error.message)
		throw new AppError('internal-server-error', 'Internal server error')
	}

	return entityParse.data
}
