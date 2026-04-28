import { AppError } from '@errors/app.error'
import { client as pg } from '../client'
import type { PredefinedTagModel } from '../models/predefined-tag.model'

class PredefinedTagsResource {
  async findAll(): Promise<PredefinedTagModel[]> {
    return pg.sql<PredefinedTagModel[]>`
      SELECT * FROM predefined_tags ORDER BY category, label
    `
  }

  async create(data: {
    category: string
    label: string
    color: string
  }): Promise<PredefinedTagModel> {
    const [row] = await pg.sql<PredefinedTagModel[]>`
      INSERT INTO predefined_tags (category, label, color)
      VALUES (${data.category}, ${data.label}, ${data.color})
      RETURNING *
    `
    if (!row) throw new AppError('internal-server-error', 'Tag creation failed')
    return row
  }
}

export default Object.freeze(new PredefinedTagsResource())
