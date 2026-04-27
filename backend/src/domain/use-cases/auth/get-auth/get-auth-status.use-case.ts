import type { InitStatus } from '@entities'
import { UseCase } from '../../use-case'
import {
	checkJwtCookie,
	getOwner,
	getPasskeyCreationOptions,
	parseStatus,
} from './get-auth-status.service'

class GetAuthStatusUseCase extends UseCase<{
	status: InitStatus
	passkeyOptions?: PublicKeyCredentialCreationOptionsJSON
}> {
	async Execute(jwtCookie?: string) {
		if (jwtCookie) {
			const isValid = await this.runStep(
				'Check JWT cookie',
				checkJwtCookie.bind(this, jwtCookie),
			)
			if (isValid) return { status: 'connected' as const }
		}

		const { account, passkey } = await this.runStep(
			'Get Owner',
			getOwner.bind(this),
		)
		const status = await this.runStep(
			'Parse Status',
			parseStatus.bind(this, passkey),
		)

		if (status === 'need-first-auth') {
			const passkeyOptions = await this.runStep(
				'Generate Passkey Options',
				getPasskeyCreationOptions.bind(this, account),
			)
			return { status, passkeyOptions }
		}

		return { status }
	}
}

export const GetAuthStatus = new GetAuthStatusUseCase()
