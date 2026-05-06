import { UseCase } from '../../use-case'
import { repository } from '../../../../data/repository/factory'
import { searchAppsOnGitHub } from '../github/github-search.service'
import type { AppEntity } from '@entities'

class SyncAppsUseCaseClass extends UseCase<AppEntity[]> {
  async Execute(): Promise<AppEntity[]> {
    const found = await this.runStep('Read apps from infra repo', searchAppsOnGitHub)
    await this.runStep('Upsert apps in DB', () =>
      Promise.all(
        found.map(({ appName, repoName, repoUrl, imageName }) =>
          repository.apps.upsertFromInfra({ appName, repoName, repoUrl, imageName }),
        ),
      ),
    )
    return this.runStep('Fetch all apps', () => repository.apps.findAll())
  }
}

export const SyncApps = Object.freeze(new SyncAppsUseCaseClass())
