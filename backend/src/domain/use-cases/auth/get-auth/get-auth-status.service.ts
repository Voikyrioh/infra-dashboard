import Config from '@config'
import type { AccountEntity, PasskeyEntity } from '@entities'
import { generateRegistrationOptions } from '@simplewebauthn/server'
import { verify } from 'hono/jwt'
import { repository } from '../../../../data/repository/factory'
import type { InitStatus } from '../../../entities/init-status.model'
import { rpID, rpName } from '../../../entities/rp.class'
import { storeChallenge } from '../challenge.store'

export async function getOwner() {
	return repository.accounts.getOwnerInformations()
}

export function parseStatus(passkey: PasskeyEntity | undefined): InitStatus {
	if (!passkey) return 'need-first-auth'
	return 'need-auth'
}

export async function checkJwtCookie(token: string): Promise<boolean> {
	try {
		await verify(token, Config.Server.SigningKey, 'HS256')
		return true
	} catch {
		return false
	}
}

export async function getPasskeyCreationOptions(account: AccountEntity) {
	const options: PublicKeyCredentialCreationOptionsJSON =
		await generateRegistrationOptions({
			rpName,
			rpID,
			userName: account.name,
			attestationType: 'none',
			excludeCredentials: [],
			authenticatorSelection: {
				residentKey: 'preferred',
				userVerification: 'preferred',
				authenticatorAttachment: 'cross-platform',
			},
		})

	storeChallenge(options.challenge, options.user.id)

	return options
}
