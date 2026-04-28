import type { PredefinedTagEntity } from '@entities'
import { resources } from '../../database/postgres'
import { assertAndCoercePredefinedTagModelToEntity } from './dao/predefined-tag.dao'

export class TagsRepository {
	async findAll(): Promise<PredefinedTagEntity[]> {
		const models = await resources.predefinedTags.findAll()
		return models.map(assertAndCoercePredefinedTagModelToEntity)
	}

	async create(data: {
		category: string
		label: string
		color: string
	}): Promise<PredefinedTagEntity> {
		const model = await resources.predefinedTags.create(data)
		return assertAndCoercePredefinedTagModelToEntity(model)
	}
}
