import type { AppEntity, PredefinedTagEntity } from '@entities'
import { resources } from '../../database/postgres'
import { assertAndCoerceAppModelToEntity } from './dao/app.dao'
import { assertAndCoercePredefinedTagModelToEntity } from './dao/predefined-tag.dao'

export class AppsRepository {
	async findAll(): Promise<AppEntity[]> {
		const models = await resources.apps.findAll()
		return Promise.all(
			models.map(async (model) => {
				const tagModels = await resources.appTags.findTagsForApp(model.id)
				const tags: PredefinedTagEntity[] = tagModels.map(
					assertAndCoercePredefinedTagModelToEntity,
				)
				return assertAndCoerceAppModelToEntity(model, tags)
			}),
		)
	}

	async upsertFromGitHub(
		repoName: string,
		repoUrl: string,
	): Promise<AppEntity> {
		const model = await resources.apps.upsert(repoName, repoUrl)
		return assertAndCoerceAppModelToEntity(model)
	}

	async configure(
		id: string,
		data: {
			displayName: string
			type: string
			containerName: string
			tagIds: string[]
		},
	): Promise<AppEntity> {
		const model = await resources.apps.configure(id, {
			displayName: data.displayName,
			type: data.type,
			containerName: data.containerName,
		})
		await resources.appTags.replaceTagsForApp(id, data.tagIds)
		const tagModels = await resources.appTags.findTagsForApp(id)
		const tags: PredefinedTagEntity[] = tagModels.map(
			assertAndCoercePredefinedTagModelToEntity,
		)
		return assertAndCoerceAppModelToEntity(model, tags)
	}
}
