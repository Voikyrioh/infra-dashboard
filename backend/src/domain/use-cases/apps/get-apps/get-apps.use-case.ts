import { UseCase } from '../../use-case'
import { repository } from '../../../../data/repository/factory'
import { getContainerStatus } from '../docker/container-status.service'
import type { AppWithStatus } from '@entities'

class GetAppsUseCaseClass extends UseCase<AppWithStatus[]> {
  async Execute(): Promise<AppWithStatus[]> {
    const apps = await this.runStep('Fetch apps from DB', () =>
      repository.apps.findAll(),
    )
    return this.runStep('Enrich with live state', () =>
      Promise.all(
        apps.map(async (app) => {
          if (!app.configured || !app.containerName) {
            return { ...app, containerStatus: null, deployedVersion: null }
          }
          const { status, version } = await getContainerStatus(app.containerName)
          return { ...app, containerStatus: status, deployedVersion: version }
        }),
      ),
    )
  }
}

export const GetApps = Object.freeze(new GetAppsUseCaseClass())
