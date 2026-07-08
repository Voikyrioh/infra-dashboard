import { UseCase } from '../../use-case'
import { type HistoryMetrics, type HistoryRange, fetchHistory } from './get-history.service'

class GetHistoryUseCase extends UseCase<HistoryMetrics> {
	async Execute(range: HistoryRange) {
		return this.runStep('Fetch SigNoz metrics history', fetchHistory.bind(this, range))
	}
}

export const GetHistory = new GetHistoryUseCase()
