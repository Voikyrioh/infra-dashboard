import type { RegistrationResponseJSON } from '@simplewebauthn/server'
import { UseCase } from '../../use-case'
import {
	assertNeedsFirstAuth,
	generateToken,
	savePasskey,
	verifyInitPassword,
	verifyPasskeyRegistration,
} from './init-first-auth.service'

class InitFirstAuthUseCase extends UseCase<{ token: string }> {
	async Execute(
		password: string,
		registrationResponse: RegistrationResponseJSON,
		ip: string,
	) {
		const account = await this.runStep(
			'Assert need-first-auth',
			assertNeedsFirstAuth.bind(this),
		)

		await this.runStep(
			'Verify init password',
			verifyInitPassword.bind(this, password),
		)

		const { registrationInfo, webauthnUserID } = await this.runStep(
			'Verify passkey registration',
			verifyPasskeyRegistration.bind(this, registrationResponse),
		)

		await this.runStep(
			'Save passkey',
			savePasskey.bind(this, account.id, registrationInfo, webauthnUserID, ip),
		)

		const token = await this.runStep(
			'Generate JWT',
			generateToken.bind(this, account.id),
		)

		return { token }
	}
}

export const InitFirstAuth = new InitFirstAuthUseCase()
