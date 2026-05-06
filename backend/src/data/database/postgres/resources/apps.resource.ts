import { AppError } from '@errors/app.error'
import { client as pg } from '../client'
import type { AppModel } from '../models/app.model'

class AppsResource {
  async findAll(): Promise<AppModel[]> {
    return pg.sql<AppModel[]>`SELECT * FROM apps ORDER BY created_at DESC`
  }

  async findById(id: string): Promise<AppModel> {
    const [row] = await pg.sql<AppModel[]>`SELECT * FROM apps WHERE id = ${id}`
    if (!row) throw new AppError('not-found', 'App not found')
    return row
  }

  async upsert(params: {
    repoName: string
    repoUrl: string
    appName: string
    imageName: string
  }): Promise<AppModel> {
    const { repoName, repoUrl, appName, imageName } = params
    const [row] = await pg.sql<AppModel[]>`
      INSERT INTO apps (repo_name, repo_url, app_name, image_name, last_synced_at)
      VALUES (${repoName}, ${repoUrl}, ${appName}, ${imageName}, now())
      ON CONFLICT (repo_name)
      DO UPDATE SET
        app_name = ${appName},
        image_name = ${imageName},
        last_synced_at = now()
      RETURNING *
    `
    if (!row) throw new AppError('internal-server-error', 'Upsert apps failed')
    return row
  }

  async configure(
    id: string,
    data: { displayName: string; type: string; containerName: string },
  ): Promise<AppModel> {
    const [row] = await pg.sql<AppModel[]>`
      UPDATE apps
      SET display_name = ${data.displayName},
          type = ${data.type},
          container_name = ${data.containerName},
          configured = true,
          updated_at = now()
      WHERE id = ${id}
      RETURNING *
    `
    if (!row) throw new AppError('not-found', 'App not found')
    return row
  }
}

export default Object.freeze(new AppsResource())
