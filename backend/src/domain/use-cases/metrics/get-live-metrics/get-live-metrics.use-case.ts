import { UseCase } from '../../use-case'
import { type LiveMetrics, fetchLiveMetrics } from './get-live-metrics.service'

class GetLiveMetricsUseCase extends UseCase<LiveMetrics> {
	async Execute() {
		return this.runStep('Fetch Docker stats', fetchLiveMetrics)
	}
}

export const GetLiveMetrics = new GetLiveMetricsUseCase()
