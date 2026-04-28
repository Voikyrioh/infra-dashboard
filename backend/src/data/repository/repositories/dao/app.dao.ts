import { type AppEntity, appEntitySchema } from '@entities'
import { AppError } from '@errors/app.error'
import logger from '@logger'
import type { PredefinedTagEntity } from '@entities'
import type { AppModel } from '../../../database/postgres/models/app.model'

export const assertAndCoerceAppModelToEntity = (
  model: AppModel,
  tags: PredefinedTagEntity[] = [],
): AppEntity => {
  const parse = appEntitySchema.safeParse({
    id: model.id,
    repoName: model.repo_name,
    repoUrl: model.repo_url,
    displayName: model.display_name,
    type: model.type,
    containerName: model.container_name,
    configured: model.configured,
    lastSyncedAt: model.last_synced_at,
    createdAt: model.created_at,
    tags,
  })
  if (!parse.success) {
    logger.error(parse.error.message)
    throw new AppError('internal-server-error', 'Internal server error')
  }
  return parse.data
}
