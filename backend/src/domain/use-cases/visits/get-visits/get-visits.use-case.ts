import { UseCase } from '../../use-case'
import { type VisitsData, fetchVisits } from './get-visits.service'

class GetVisitsUseCase extends UseCase<VisitsData> {
  async Execute() {
    return this.runStep('Fetch visits data', fetchVisits)
  }
}

export const GetVisits = new GetVisitsUseCase()
