import type { AuthenticationResponseJSON } from '@simplewebauthn/server'
import { UseCase } from '../../use-case'
import {
	generateToken,
	updatePasskeyCounter,
	verifyPasskeyAuth,
} from './verify-auth.service'

class VerifyAuthUseCase extends UseCase<{ token: string }> {
	async Execute(authResponse: AuthenticationResponseJSON) {
		const { passkey, newCounter } = await this.runStep(
			'Verify passkey authentication',
			verifyPasskeyAuth.bind(this, authResponse),
		)

		await this.runStep(
			'Update passkey counter',
			updatePasskeyCounter.bind(this, passkey.credentialId, newCounter),
		)

		const token = await this.runStep(
			'Generate JWT',
			generateToken.bind(this, passkey.accountId),
		)

		return { token }
	}
}

export const VerifyAuth = new VerifyAuthUseCase()
