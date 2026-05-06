import { UseCase } from '../../use-case'
import { repository } from '../../../../data/repository/factory'
import { getImageVersions } from '../github/ghcr.service'

class GetAppVersionsUseCaseClass extends UseCase<string[]> {
  async Execute(id: string): Promise<string[]> {
    const app = await this.runStep('Fetch app from DB', () => repository.apps.findById(id))
    if (!app.imageName) return []
    return this.runStep('Fetch GHCR versions', () => getImageVersions(app.imageName!))
  }
}

export const GetAppVersions = Object.freeze(new GetAppVersionsUseCaseClass())
