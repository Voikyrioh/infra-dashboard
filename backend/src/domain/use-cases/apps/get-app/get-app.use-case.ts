import { UseCase } from '../../use-case'
import { repository } from '../../../../data/repository/factory'
import { getContainerStatus } from '../docker/container-status.service'
import type { AppWithStatus } from '@entities'

class GetAppUseCaseClass extends UseCase<AppWithStatus> {
  async Execute(id: string): Promise<AppWithStatus> {
    const app = await this.runStep('Fetch app from DB', () =>
      repository.apps.findById(id),
    )
    if (!app.configured || !app.containerName) {
      return { ...app, containerStatus: null, deployedVersion: null }
    }
    const { status, version } = await this.runStep('Get container status', () =>
      getContainerStatus(app.containerName!),
    )
    return { ...app, containerStatus: status, deployedVersion: version }
  }
}

export const GetApp = Object.freeze(new GetAppUseCaseClass())
