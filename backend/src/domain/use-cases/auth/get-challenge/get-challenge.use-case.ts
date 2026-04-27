import { AppError } from '@errors/app.error'
import { UseCase } from '../../use-case'
import { getOwner } from '../get-auth/get-auth-status.service'
import { generateChallenge } from './get-challenge.service'

class GetChallengeUseCase extends UseCase<PublicKeyCredentialRequestOptionsJSON> {
	async Execute() {
		const { account, passkey } = await this.runStep(
			'Get Owner',
			getOwner.bind(this),
		)

		if (!passkey) {
			throw new AppError('invalid-payload', 'No passkey registered')
		}

		const options = await this.runStep(
			'Generate Challenge',
			generateChallenge.bind(this, account.id, passkey),
		)

		return options
	}
}

export const GetChallenge = new GetChallengeUseCase()
