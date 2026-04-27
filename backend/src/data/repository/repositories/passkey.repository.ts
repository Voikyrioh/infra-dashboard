import type { PasskeyEntity } from '@entities'
import type { VerifiedRegistrationInfo } from '../../../domain/use-cases/auth/init-first-auth/init-first-auth.service'
import { assertAndCoercePasskeyModelToEntity } from './dao/passkey.dao'
import { resources } from '../../database/postgres'

export class PasskeysRepository {
	async savePasskey(
		accountId: string,
		registrationInfo: VerifiedRegistrationInfo,
		webauthnUserID: string,
		ip: string,
	) {
		const { credential, credentialDeviceType, credentialBackedUp } = registrationInfo
		const now = new Date()
		await resources.passkeys.addPasskeyAccount({
			credential_id: credential.id,
			public_key: Buffer.from(credential.publicKey),
			account_id: accountId,
			webauthn_user_id: webauthnUserID,
			counter: credential.counter,
			backed_eligible: credentialDeviceType === 'multiDevice',
			backed_up: credentialBackedUp,
			transports: credential.transports?.join('|') ?? '',
			created_at: now,
			last_login: now,
			last_ip: ip,
		})
	}

	async findByCredentialId(credentialId: string): Promise<PasskeyEntity> {
		const model = await resources.passkeys.getPasskeyByCredentialId(credentialId)
		return assertAndCoercePasskeyModelToEntity(model)
	}

	async updateCounter(credentialId: string, counter: number): Promise<void> {
		const model = await resources.passkeys.getPasskeyByCredentialId(credentialId)
		await resources.passkeys.updateCounter(model.id, counter)
	}
}
