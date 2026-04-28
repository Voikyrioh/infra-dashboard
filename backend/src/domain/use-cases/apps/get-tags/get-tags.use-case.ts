import { UseCase } from '../../use-case'
import { repository } from '../../../../data/repository/factory'
import type { PredefinedTagEntity } from '@entities'

class GetTagsUseCaseClass extends UseCase<PredefinedTagEntity[]> {
  async Execute(): Promise<PredefinedTagEntity[]> {
    return this.runStep('Fetch predefined tags', () => repository.tags.findAll())
  }
}

export const GetTags = Object.freeze(new GetTagsUseCaseClass())
