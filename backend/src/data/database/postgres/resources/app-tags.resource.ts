import { client as pg } from '../client'
import type { PredefinedTagModel } from '../models/predefined-tag.model'

class AppTagsResource {
  async findTagsForApp(appId: string): Promise<PredefinedTagModel[]> {
    return pg.sql<PredefinedTagModel[]>`
      SELECT pt.* FROM predefined_tags pt
      INNER JOIN app_tags ON app_tags.tag_id = pt.id
      WHERE app_tags.app_id = ${appId}
    `
  }

  async replaceTagsForApp(appId: string, tagIds: string[]): Promise<void> {
    await pg.sql`DELETE FROM app_tags WHERE app_id = ${appId}`
    for (const tagId of tagIds) {
      await pg.sql`INSERT INTO app_tags (app_id, tag_id) VALUES (${appId}, ${tagId})`
    }
  }
}

export default Object.freeze(new AppTagsResource())
