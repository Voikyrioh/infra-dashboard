import { z } from 'zod/v4'
import { UseCase } from '../../use-case'
import { repository } from '../../../../data/repository/factory'
import type { PredefinedTagEntity } from '@entities'

export const createTagSchema = z.object({
  category: z.string().min(1),
  label: z.string().min(1),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
})

export type CreateTagInput = z.infer<typeof createTagSchema>

class CreateTagUseCaseClass extends UseCase<PredefinedTagEntity> {
  async Execute(data: CreateTagInput): Promise<PredefinedTagEntity> {
    return this.runStep('Create predefined tag', () =>
      repository.tags.create(data),
    )
  }
}

export const CreateTag = Object.freeze(new CreateTagUseCaseClass())
