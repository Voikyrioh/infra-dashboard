import { z } from 'zod'
import { UseCase } from '../../use-case'
import { repository } from '../../../../data/repository/factory'
import { AppError } from '@errors/app.error'
import { triggerDeploy } from '../github/github-dispatch.service'

export const deployVersionSchema = z.object({
  version: z.string().regex(/^v\d+\.\d+\.\d+$/, 'Version must match vX.Y.Z'),
})

export type DeployVersionInput = z.infer<typeof deployVersionSchema>

class DeployVersionUseCaseClass extends UseCase<void> {
  async Execute(id: string, version: string): Promise<void> {
    const app = await this.runStep('Fetch app from DB', () => repository.apps.findById(id))
    if (!app.appName) {
      throw new AppError('invalid-payload', 'App not provisioned (missing app_name)')
    }
    await this.runStep('Trigger deploy workflow', () => triggerDeploy(app.appName!, version))
  }
}

export const DeployVersion = Object.freeze(new DeployVersionUseCaseClass())
