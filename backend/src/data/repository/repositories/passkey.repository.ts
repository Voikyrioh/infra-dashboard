import type { VerifiedRegistrationInfo } from '../../../domain/use-cases/auth/init-first-auth/init-first-auth.service'
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
}
