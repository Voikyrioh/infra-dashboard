import { UseCase } from '../../use-case'
import { repository } from '../../../../data/repository/factory'
import { getLastDeployStatus } from '../github/github-actions.service'
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
            return { ...app, deployStatus: null, containerStatus: null }
          }
          const [deployStatus, containerStatus] = await Promise.all([
            getLastDeployStatus(app.repoName),
            getContainerStatus(app.containerName),
          ])
          return { ...app, deployStatus, containerStatus }
        }),
      ),
    )
  }
}

export const GetApps = Object.freeze(new GetAppsUseCaseClass())
