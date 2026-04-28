import { z } from 'zod/v4'
import { UseCase } from '../../use-case'
import { repository } from '../../../../data/repository/factory'
import type { AppEntity } from '@entities'

export const configureAppSchema = z.object({
  displayName: z.string().min(1),
  type: z.enum(['frontend', 'backend', 'fullstack']),
  containerName: z.string().min(1),
  tagIds: z.array(z.string().uuid()),
})

export type ConfigureAppInput = z.infer<typeof configureAppSchema>

class ConfigureAppUseCaseClass extends UseCase<AppEntity> {
  async Execute(id: string, data: ConfigureAppInput): Promise<AppEntity> {
    return this.runStep('Configure app', () =>
      repository.apps.configure(id, data),
    )
  }
}

export const ConfigureApp = Object.freeze(new ConfigureAppUseCaseClass())
