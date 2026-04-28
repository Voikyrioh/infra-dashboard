import { type PredefinedTagEntity, predefinedTagSchema } from '@entities'
import { AppError } from '@errors/app.error'
import logger from '@logger'
import type { PredefinedTagModel } from '../../../database/postgres/models/predefined-tag.model'

export const assertAndCoercePredefinedTagModelToEntity = (
  model: PredefinedTagModel,
): PredefinedTagEntity => {
  const parse = predefinedTagSchema.safeParse({
    id: model.id,
    category: model.category,
    label: model.label,
    color: model.color,
  })
  if (!parse.success) {
    logger.error(parse.error.message)
    throw new AppError('internal-server-error', 'Internal server error')
  }
  return parse.data
}
