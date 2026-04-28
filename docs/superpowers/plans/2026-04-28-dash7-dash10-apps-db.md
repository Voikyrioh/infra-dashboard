# Feature 2 — Base de données d'applications (DASH-7–10) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Synchroniser les apps depuis GitHub, les stocker en base, les configurer manuellement, et les afficher sur une page `/applications` avec leurs états live (deploy + container).

**Architecture:** GitHub Code Search API détecte les repos référençant le workflow réutilisable → upsert dans PostgreSQL → `GET /api/v1/apps` enrichit chaque app configurée en parallèle (GitHub Actions runs + Docker socket) → frontend Vue 3 affiche une liste verticale avec modale de configuration.

**Tech Stack:** Hono + TypeScript + Zod v4 + postgres (SQL taggé) + Docker socket HTTP · Vue 3 + Pinia + Tailwind CSS 4 + Vitest + Playwright

---

## Carte des fichiers

### Backend — nouveaux
| Fichier | Rôle |
|---|---|
| `backend/migrations/20260428100000-apps.js` | Table `apps` |
| `backend/migrations/20260428100001-predefined-tags.js` | Table `predefined_tags` + seed |
| `backend/migrations/20260428100002-app-tags.js` | Table `app_tags` (jonction) |
| `backend/src/domain/entities/app.ts` | `AppEntity` + `AppWithStatus` Zod |
| `backend/src/domain/entities/predefined-tag.ts` | `PredefinedTagEntity` Zod |
| `backend/src/data/database/postgres/models/app.model.ts` | `AppModel` (DB brut) |
| `backend/src/data/database/postgres/models/predefined-tag.model.ts` | `PredefinedTagModel` |
| `backend/src/data/database/postgres/resources/apps.resource.ts` | SQL apps |
| `backend/src/data/database/postgres/resources/predefined-tags.resource.ts` | SQL tags |
| `backend/src/data/database/postgres/resources/app-tags.resource.ts` | SQL jointure |
| `backend/src/data/repository/repositories/dao/app.dao.ts` | Model → Entity |
| `backend/src/data/repository/repositories/dao/predefined-tag.dao.ts` | Model → Entity |
| `backend/src/data/repository/repositories/apps.repository.ts` | Logique repo apps |
| `backend/src/data/repository/repositories/tags.repository.ts` | Logique repo tags |
| `backend/src/domain/use-cases/apps/github/github-search.service.ts` | Code Search API |
| `backend/src/domain/use-cases/apps/github/github-actions.service.ts` | Actions runs API |
| `backend/src/domain/use-cases/apps/docker/container-status.service.ts` | Docker socket status |
| `backend/src/domain/use-cases/apps/sync-apps/sync-apps.use-case.ts` | SyncApps |
| `backend/src/domain/use-cases/apps/get-apps/get-apps.use-case.ts` | GetApps + enrichissement |
| `backend/src/domain/use-cases/apps/configure-app/configure-app.use-case.ts` | ConfigureApp + schéma |
| `backend/src/domain/use-cases/apps/get-tags/get-tags.use-case.ts` | GetTags |
| `backend/src/domain/use-cases/apps/create-tag/create-tag.use-case.ts` | CreateTag + schéma |
| `backend/src/domain/use-cases/apps/__tests__/github.service.test.ts` | Tests services GitHub |
| `backend/src/entry-points/routes/apps.ts` | Routes /apps |
| `backend/src/entry-points/routes/tags.ts` | Routes /tags |

### Backend — modifiés
| Fichier | Modification |
|---|---|
| `backend/src/config/params/server.config.ts` | +`GitHubToken`, `GitHubOwner` |
| `backend/src/config/index.ts` | +types pour GitHub |
| `backend/src/domain/entities/index.ts` | Re-export app + predefined-tag |
| `backend/src/data/database/postgres/resources/index.ts` | +apps, predefinedTags, appTags |
| `backend/src/data/repository/factory.ts` | +repos apps + tags |
| `backend/src/domain/use-cases/index.ts` | Export nouveaux use-cases |
| `backend/src/entry-points/app.ts` | Mount appsRoute + tagsRoute |

### Frontend — nouveaux
| Fichier | Rôle |
|---|---|
| `frontend/src/services/apps.service.ts` | Appels API apps + tags |
| `frontend/src/stores/apps.store.ts` | État global apps |
| `frontend/src/components/atoms/TagPill/TagPill.vue` | Pill de tag (affichage/sélectable) |
| `frontend/src/components/atoms/TagPill/TagPill.spec.ts` | Tests TagPill |
| `frontend/src/components/molecules/AppRow/AppRow.vue` | Ligne du tableau |
| `frontend/src/components/molecules/AppRow/AppRow.spec.ts` | Tests AppRow |
| `frontend/src/components/molecules/AppConfigModal/AppConfigModal.vue` | Modale configuration |
| `frontend/src/components/molecules/AppConfigModal/AppConfigModal.spec.ts` | Tests AppConfigModal |
| `frontend/src/components/pages/ApplicationsPage/ApplicationsPage.vue` | Page /applications |
| `frontend/src/components/pages/ApplicationsPage/ApplicationsPage.spec.ts` | Tests page |
| `frontend/e2e/applications.spec.ts` | Tests E2E Playwright |

### Frontend — modifié
| Fichier | Modification |
|---|---|
| `frontend/src/router/index.ts` | +route `/applications` |

---

## Task 1 : Migrations DB (DASH-9)

**Files:**
- Create: `backend/migrations/20260428100000-apps.js`
- Create: `backend/migrations/20260428100001-predefined-tags.js`
- Create: `backend/migrations/20260428100002-app-tags.js`

- [ ] **Écrire la migration apps**

```javascript
// backend/migrations/20260428100000-apps.js
var dbm
var type
var seed

exports.setup = (options, seedLink) => {
  dbm = options.dbmigrate
  type = dbm.dataType
  seed = seedLink
}

exports.up = (db) =>
  db
    .createTable('apps', {
      id: {
        type: 'uuid',
        primaryKey: true,
        defaultValue: new String('uuidv7()'),
      },
      repo_name: { type: 'string', notNull: true },
      repo_url: { type: 'string', notNull: true },
      display_name: { type: 'string' },
      type: { type: 'string' },
      container_name: { type: 'string' },
      configured: { type: 'boolean', notNull: true, defaultValue: false },
      last_synced_at: { type: 'timestamptz' },
      created_at: { type: 'timestamptz', defaultValue: String('now()') },
      updated_at: { type: 'timestamptz', defaultValue: String('now()') },
    })
    .then(() =>
      db.runSql(
        'CREATE UNIQUE INDEX apps_repo_name_unique ON apps (repo_name)',
      ),
    )

exports.down = (db) => db.dropTable('apps')

exports._meta = { version: 1 }
```

- [ ] **Écrire la migration predefined_tags (avec seed)**

```javascript
// backend/migrations/20260428100001-predefined-tags.js
var dbm
var type
var seed

exports.setup = (options, seedLink) => {
  dbm = options.dbmigrate
  type = dbm.dataType
  seed = seedLink
}

exports.up = (db) =>
  db
    .createTable('predefined_tags', {
      id: {
        type: 'uuid',
        primaryKey: true,
        defaultValue: new String('uuidv7()'),
      },
      category: { type: 'string', notNull: true },
      label: { type: 'string', notNull: true },
      color: { type: 'string', notNull: true },
    })
    .then(() =>
      db.runSql(`
        INSERT INTO predefined_tags (category, label, color) VALUES
          ('database', 'PostgreSQL', '#336791'),
          ('database', 'Redis', '#DC382D'),
          ('database', 'MongoDB', '#47A248'),
          ('database', 'MySQL', '#4479A1'),
          ('database', 'SQLite', '#003B57')
      `),
    )

exports.down = (db) => db.dropTable('predefined_tags')

exports._meta = { version: 1 }
```

- [ ] **Écrire la migration app_tags**

```javascript
// backend/migrations/20260428100002-app-tags.js
var dbm
var type
var seed

exports.setup = (options, seedLink) => {
  dbm = options.dbmigrate
  type = dbm.dataType
  seed = seedLink
}

exports.up = (db) =>
  db
    .createTable('app_tags', {
      app_id: {
        type: 'uuid',
        foreignKey: {
          name: 'app_tags_app_id_fk',
          table: 'apps',
          rules: { onDelete: 'CASCADE', onUpdate: 'RESTRICT' },
          mapping: 'id',
        },
      },
      tag_id: {
        type: 'uuid',
        foreignKey: {
          name: 'app_tags_tag_id_fk',
          table: 'predefined_tags',
          rules: { onDelete: 'CASCADE', onUpdate: 'RESTRICT' },
          mapping: 'id',
        },
      },
    })
    .then(() =>
      db.runSql(
        'ALTER TABLE app_tags ADD CONSTRAINT app_tags_pkey PRIMARY KEY (app_id, tag_id)',
      ),
    )

exports.down = (db) => db.dropTable('app_tags')

exports._meta = { version: 1 }
```

- [ ] **Lancer les migrations**

```bash
cd backend && npm run migrate
```
Résultat attendu : `[INFO] Processed migration 20260428100000-apps`, `...100001-predefined-tags`, `...100002-app-tags`

- [ ] **Commit**

```bash
git add backend/migrations/
git commit -m "feat(DASH-9): migrations apps, predefined_tags, app_tags"
```

---

## Task 2 : Config GitHub + entités

**Files:**
- Modify: `backend/src/config/params/server.config.ts`
- Modify: `backend/src/config/index.ts`
- Create: `backend/src/domain/entities/app.ts`
- Create: `backend/src/domain/entities/predefined-tag.ts`
- Modify: `backend/src/domain/entities/index.ts`

- [ ] **Ajouter GitHubToken et GitHubOwner dans server.config.ts**

Ajouter à la fin de l'objet exporté dans `backend/src/config/params/server.config.ts` :
```typescript
GitHubToken: {
  name: 'GITHUB_TOKEN',
  description: 'GitHub Personal Access Token (scope repo, lecture)',
  default: {
    _: null,
  },
  validator: z.string().nullish().default(null),
},
GitHubOwner: {
  name: 'GITHUB_OWNER',
  description: 'GitHub owner username',
  default: {
    _: 'voikyrioh',
  },
  validator: z.string().min(1),
},
```

- [ ] **Mettre à jour les types dans backend/src/config/index.ts**

Ajouter `GitHubToken: string | null` et `GitHubOwner: string` dans le type du `generateConfig` pour `Server` :
```typescript
// Ajouter dans le bloc de type Server :
GitHubToken: string | null
GitHubOwner: string
```

- [ ] **Créer backend/src/domain/entities/predefined-tag.ts**

```typescript
import { z } from 'zod/v4'

export const predefinedTagSchema = z.object({
  id: z.uuid(),
  category: z.string(),
  label: z.string(),
  color: z.string(),
})

export type PredefinedTagEntity = z.infer<typeof predefinedTagSchema>
```

- [ ] **Créer backend/src/domain/entities/app.ts**

```typescript
import { z } from 'zod/v4'
import { predefinedTagSchema } from './predefined-tag'

export const appEntitySchema = z.object({
  id: z.uuid(),
  repoName: z.string(),
  repoUrl: z.string(),
  displayName: z.string().nullable(),
  type: z.enum(['frontend', 'backend', 'fullstack']).nullable(),
  containerName: z.string().nullable(),
  configured: z.boolean(),
  lastSyncedAt: z.date().nullable(),
  createdAt: z.date(),
  tags: z.array(predefinedTagSchema).default([]),
})

export const appWithStatusSchema = appEntitySchema.extend({
  deployStatus: z
    .object({
      conclusion: z
        .enum(['success', 'failure', 'cancelled', 'timed_out'])
        .nullable(),
      runAt: z.date().nullable(),
    })
    .nullable()
    .default(null),
  containerStatus: z
    .enum(['running', 'stopped', 'unknown'])
    .nullable()
    .default(null),
})

export type AppEntity = z.infer<typeof appEntitySchema>
export type AppWithStatus = z.infer<typeof appWithStatusSchema>
```

- [ ] **Mettre à jour backend/src/domain/entities/index.ts**

```typescript
export * from './account'
export * from './init-status.model'
export * from './passkey'
export * from './app'
export * from './predefined-tag'
```

- [ ] **Commit**

```bash
git add backend/src/config/ backend/src/domain/entities/
git commit -m "feat(DASH-9): config GitHub + entités AppEntity, AppWithStatus, PredefinedTagEntity"
```

---

## Task 3 : Modèles DB + DAOs

**Files:**
- Create: `backend/src/data/database/postgres/models/app.model.ts`
- Create: `backend/src/data/database/postgres/models/predefined-tag.model.ts`
- Create: `backend/src/data/repository/repositories/dao/app.dao.ts`
- Create: `backend/src/data/repository/repositories/dao/predefined-tag.dao.ts`

- [ ] **Créer backend/src/data/database/postgres/models/app.model.ts**

```typescript
import { z } from 'zod/v4'

export const appModelSchema = z.object({
  id: z.string(),
  repo_name: z.string(),
  repo_url: z.string(),
  display_name: z.string().nullable(),
  type: z.string().nullable(),
  container_name: z.string().nullable(),
  configured: z.boolean(),
  last_synced_at: z.date().nullable(),
  created_at: z.date(),
  updated_at: z.date(),
})

export type AppModel = z.infer<typeof appModelSchema>
```

- [ ] **Créer backend/src/data/database/postgres/models/predefined-tag.model.ts**

```typescript
import { z } from 'zod/v4'

export const predefinedTagModelSchema = z.object({
  id: z.string(),
  category: z.string(),
  label: z.string(),
  color: z.string(),
})

export type PredefinedTagModel = z.infer<typeof predefinedTagModelSchema>
```

- [ ] **Écrire le test failing pour le DAO app**

```typescript
// backend/src/data/repository/repositories/dao/__tests__/app.dao.test.ts
import { expect } from 'chai'
import { assertAndCoerceAppModelToEntity } from '../app.dao'

describe('app.dao', () => {
  it('transforme un AppModel en AppEntity', () => {
    const model = {
      id: '018f5e3e-0000-7000-8000-000000000001',
      repo_name: 'my-app',
      repo_url: 'https://github.com/voikyrioh/my-app',
      display_name: 'My App',
      type: 'backend',
      container_name: 'my-app',
      configured: true,
      last_synced_at: new Date('2026-01-01'),
      created_at: new Date('2026-01-01'),
      updated_at: new Date('2026-01-01'),
    }
    const entity = assertAndCoerceAppModelToEntity(model)
    expect(entity.repoName).to.equal('my-app')
    expect(entity.type).to.equal('backend')
    expect(entity.tags).to.deep.equal([])
  })

  it('accepte display_name null', () => {
    const model = {
      id: '018f5e3e-0000-7000-8000-000000000001',
      repo_name: 'my-app',
      repo_url: 'https://github.com/voikyrioh/my-app',
      display_name: null,
      type: null,
      container_name: null,
      configured: false,
      last_synced_at: null,
      created_at: new Date('2026-01-01'),
      updated_at: new Date('2026-01-01'),
    }
    const entity = assertAndCoerceAppModelToEntity(model)
    expect(entity.displayName).to.be.null
    expect(entity.configured).to.be.false
  })
})
```

- [ ] **Lancer le test pour vérifier qu'il échoue**

```bash
cd backend && npm test -- --grep "app.dao"
```
Résultat attendu : erreur `Cannot find module '../app.dao'`

- [ ] **Créer backend/src/data/repository/repositories/dao/app.dao.ts**

```typescript
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
```

- [ ] **Créer backend/src/data/repository/repositories/dao/predefined-tag.dao.ts**

```typescript
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
```

- [ ] **Lancer le test pour vérifier qu'il passe**

```bash
cd backend && npm test -- --grep "app.dao"
```
Résultat attendu : `2 passing`

- [ ] **Commit**

```bash
git add backend/src/data/database/postgres/models/ backend/src/data/repository/repositories/dao/
git commit -m "feat(DASH-9): modèles app + predefined-tag, DAOs"
```

---

## Task 4 : Resources SQL

**Files:**
- Create: `backend/src/data/database/postgres/resources/apps.resource.ts`
- Create: `backend/src/data/database/postgres/resources/predefined-tags.resource.ts`
- Create: `backend/src/data/database/postgres/resources/app-tags.resource.ts`
- Modify: `backend/src/data/database/postgres/resources/index.ts`

- [ ] **Créer backend/src/data/database/postgres/resources/apps.resource.ts**

```typescript
import { AppError } from '@errors/app.error'
import { client as pg } from '../client'
import type { AppModel } from '../models/app.model'

class AppsResource {
  async findAll(): Promise<AppModel[]> {
    return pg.sql<AppModel[]>`SELECT * FROM apps ORDER BY created_at DESC`
  }

  async upsert(repoName: string, repoUrl: string): Promise<AppModel> {
    const [row] = await pg.sql<AppModel[]>`
      INSERT INTO apps (repo_name, repo_url, last_synced_at)
      VALUES (${repoName}, ${repoUrl}, now())
      ON CONFLICT (repo_name)
      DO UPDATE SET last_synced_at = now()
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
```

- [ ] **Créer backend/src/data/database/postgres/resources/predefined-tags.resource.ts**

```typescript
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
```

- [ ] **Créer backend/src/data/database/postgres/resources/app-tags.resource.ts**

```typescript
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
```

- [ ] **Mettre à jour backend/src/data/database/postgres/resources/index.ts**

```typescript
import accounts from './accounts.resource'
import passkeys from './passkeys.resource'
import apps from './apps.resource'
import predefinedTags from './predefined-tags.resource'
import appTags from './app-tags.resource'

export { accounts, passkeys, apps, predefinedTags, appTags }
```

- [ ] **Commit**

```bash
git add backend/src/data/database/postgres/resources/
git commit -m "feat(DASH-9): resources SQL apps, predefined-tags, app-tags"
```

---

## Task 5 : Repositories

**Files:**
- Create: `backend/src/data/repository/repositories/apps.repository.ts`
- Create: `backend/src/data/repository/repositories/tags.repository.ts`
- Modify: `backend/src/data/repository/factory.ts`

- [ ] **Créer backend/src/data/repository/repositories/apps.repository.ts**

```typescript
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
```

- [ ] **Créer backend/src/data/repository/repositories/tags.repository.ts**

```typescript
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
```

- [ ] **Mettre à jour backend/src/data/repository/factory.ts**

```typescript
import { AccountsRepository } from './repositories/accounts.repository'
import { PasskeysRepository } from './repositories/passkey.repository'
import { AppsRepository } from './repositories/apps.repository'
import { TagsRepository } from './repositories/tags.repository'

class RepositoryFactory {
  readonly accounts: AccountsRepository
  readonly passkeys: PasskeysRepository
  readonly apps: AppsRepository
  readonly tags: TagsRepository

  constructor() {
    this.accounts = new AccountsRepository()
    this.passkeys = new PasskeysRepository()
    this.apps = new AppsRepository()
    this.tags = new TagsRepository()
  }
}

export const repository = Object.freeze(new RepositoryFactory())
```

- [ ] **Commit**

```bash
git add backend/src/data/repository/
git commit -m "feat(DASH-9): repositories apps + tags"
```

---

## Task 6 : Services GitHub + tests

**Files:**
- Create: `backend/src/domain/use-cases/apps/github/github-search.service.ts`
- Create: `backend/src/domain/use-cases/apps/github/github-actions.service.ts`
- Create: `backend/src/domain/use-cases/apps/__tests__/github.service.test.ts`

- [ ] **Écrire le test failing pour les services GitHub**

```typescript
// backend/src/domain/use-cases/apps/__tests__/github.service.test.ts
import { expect } from 'chai'
import { searchAppsOnGitHub } from '../github/github-search.service'
import { getLastDeployStatus } from '../github/github-actions.service'

const originalFetch = global.fetch

function mockFetch(response: Partial<Response>) {
  global.fetch = async () => response as Response
}

afterEach(() => {
  global.fetch = originalFetch
})

describe('github-search.service', () => {
  it('retourne les repos trouvés par la Code Search API', async () => {
    mockFetch({
      ok: true,
      json: async () => ({
        items: [
          { repository: { name: 'my-app', html_url: 'https://github.com/voikyrioh/my-app' } },
          { repository: { name: 'other-app', html_url: 'https://github.com/voikyrioh/other-app' } },
        ],
      }),
    })
    const results = await searchAppsOnGitHub()
    expect(results).to.have.length(2)
    expect(results[0]).to.deep.equal({
      repoName: 'my-app',
      repoUrl: 'https://github.com/voikyrioh/my-app',
    })
  })

  it('lance une AppError si la requête échoue', async () => {
    mockFetch({ ok: false, status: 403 })
    try {
      await searchAppsOnGitHub()
      expect.fail('Devait lancer une erreur')
    } catch (e: any) {
      expect(e.type).to.equal('internal-server-error')
    }
  })
})

describe('github-actions.service', () => {
  it('retourne le statut du dernier run', async () => {
    mockFetch({
      ok: true,
      json: async () => ({
        workflow_runs: [
          { conclusion: 'success', status: 'completed', updated_at: '2026-01-01T00:00:00Z' },
        ],
      }),
    })
    const status = await getLastDeployStatus('my-app')
    expect(status?.conclusion).to.equal('success')
    expect(status?.runAt).to.be.instanceOf(Date)
  })

  it('retourne null si aucun run', async () => {
    mockFetch({
      ok: true,
      json: async () => ({ workflow_runs: [] }),
    })
    const status = await getLastDeployStatus('my-app')
    expect(status).to.be.null
  })

  it('retourne null si la requête échoue', async () => {
    mockFetch({ ok: false })
    const status = await getLastDeployStatus('my-app')
    expect(status).to.be.null
  })
})
```

- [ ] **Lancer les tests pour vérifier qu'ils échouent**

```bash
cd backend && npm test -- --grep "github"
```
Résultat attendu : `Cannot find module '../github/github-search.service'`

- [ ] **Créer backend/src/domain/use-cases/apps/github/github-search.service.ts**

```typescript
import Config from '@config'
import { AppError } from '@errors/app.error'

interface GitHubCodeSearchResult {
  items: Array<{
    repository: {
      name: string
      html_url: string
    }
  }>
}

export async function searchAppsOnGitHub(): Promise<
  Array<{ repoName: string; repoUrl: string }>
> {
  const token = Config.Server.GitHubToken
  if (!token) throw new AppError('internal-server-error', 'GITHUB_TOKEN not configured')

  const query = encodeURIComponent(
    `${Config.Server.GitHubOwner}/dashboard/.github/workflows/build-deploy.yml in:file`,
  )
  const res = await fetch(
    `https://api.github.com/search/code?q=${query}&per_page=100`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    },
  )
  if (!res.ok)
    throw new AppError('internal-server-error', 'GitHub API unavailable')

  const data = (await res.json()) as GitHubCodeSearchResult
  return data.items.map((item) => ({
    repoName: item.repository.name,
    repoUrl: item.repository.html_url,
  }))
}
```

- [ ] **Créer backend/src/domain/use-cases/apps/github/github-actions.service.ts**

```typescript
import Config from '@config'

export interface DeployStatus {
  conclusion: 'success' | 'failure' | 'cancelled' | 'timed_out' | null
  runAt: Date | null
}

interface GitHubRunsResponse {
  workflow_runs: Array<{
    conclusion: string | null
    status: string
    updated_at: string
  }>
}

export async function getLastDeployStatus(
  repoName: string,
): Promise<DeployStatus | null> {
  const token = Config.Server.GitHubToken
  if (!token) return null

  const res = await fetch(
    `https://api.github.com/repos/${Config.Server.GitHubOwner}/${repoName}/actions/runs?per_page=1`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    },
  )
  if (!res.ok) return null
  const data = (await res.json()) as GitHubRunsResponse
  const run = data.workflow_runs[0]
  if (!run) return null
  return {
    conclusion: (run.conclusion ?? run.status) as DeployStatus['conclusion'],
    runAt: new Date(run.updated_at),
  }
}
```

- [ ] **Lancer les tests pour vérifier qu'ils passent**

```bash
cd backend && npm test -- --grep "github"
```
Résultat attendu : `5 passing`

- [ ] **Commit**

```bash
git add backend/src/domain/use-cases/apps/github/ backend/src/domain/use-cases/apps/__tests__/
git commit -m "feat(DASH-7): services GitHub search + actions avec tests"
```

---

## Task 7 : Service container Docker

**Files:**
- Create: `backend/src/domain/use-cases/apps/docker/container-status.service.ts`

- [ ] **Créer backend/src/domain/use-cases/apps/docker/container-status.service.ts**

```typescript
import http from 'node:http'
import Config from '@config'

export type ContainerStatus = 'running' | 'stopped' | 'unknown'

interface DockerContainerInfo {
  State: {
    Running: boolean
  }
}

function dockerGet<T>(socketPath: string, path: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const req = http.get({ socketPath, path }, (res) => {
      const chunks: Buffer[] = []
      res.on('data', (chunk) => chunks.push(chunk))
      res.on('end', () => {
        try {
          resolve(JSON.parse(Buffer.concat(chunks).toString()))
        } catch (e) {
          reject(e)
        }
      })
    })
    req.on('error', reject)
  })
}

export async function getContainerStatus(
  containerName: string,
): Promise<ContainerStatus> {
  try {
    const info = await dockerGet<DockerContainerInfo>(
      Config.Server.DockerSocket,
      `/containers/${containerName}/json`,
    )
    return info.State.Running ? 'running' : 'stopped'
  } catch {
    return 'unknown'
  }
}
```

- [ ] **Commit**

```bash
git add backend/src/domain/use-cases/apps/docker/
git commit -m "feat(DASH-7): service container-status Docker socket"
```

---

## Task 8 : Use-cases SyncApps + GetApps

**Files:**
- Create: `backend/src/domain/use-cases/apps/sync-apps/sync-apps.use-case.ts`
- Create: `backend/src/domain/use-cases/apps/get-apps/get-apps.use-case.ts`

- [ ] **Créer backend/src/domain/use-cases/apps/sync-apps/sync-apps.use-case.ts**

```typescript
import { UseCase } from '../../use-case'
import { repository } from '../../../../data/repository/factory'
import { searchAppsOnGitHub } from '../github/github-search.service'
import type { AppEntity } from '@entities'

class SyncAppsUseCaseClass extends UseCase<AppEntity[]> {
  async Execute(): Promise<AppEntity[]> {
    const found = await this.runStep('Search GitHub repos', searchAppsOnGitHub)
    await this.runStep('Upsert apps in DB', () =>
      Promise.all(
        found.map(({ repoName, repoUrl }) =>
          repository.apps.upsertFromGitHub(repoName, repoUrl),
        ),
      ),
    )
    return this.runStep('Fetch all apps', () => repository.apps.findAll())
  }
}

export const SyncApps = Object.freeze(new SyncAppsUseCaseClass())
```

- [ ] **Créer backend/src/domain/use-cases/apps/get-apps/get-apps.use-case.ts**

```typescript
import { UseCase } from '../../use-case'
import { repository } from '../../../../data/repository/factory'
import { getLastDeployStatus } from '../github/github-actions.service'
import { getContainerStatus } from '../docker/container-status.service'
import type { AppWithStatus } from '@entities'

class GetAppsUseCaseClass extends UseCase<AppWithStatus[]> {
  async Execute(): Promise<AppWithStatus[]> {
    const apps = await this.runStep('Fetch apps from DB', () =>
      repository.apps.findAll(),
    )
    return this.runStep('Enrich with live state', () =>
      Promise.all(
        apps.map(async (app) => {
          if (!app.configured || !app.containerName) {
            return { ...app, deployStatus: null, containerStatus: null }
          }
          const [deployStatus, containerStatus] = await Promise.all([
            getLastDeployStatus(app.repoName),
            getContainerStatus(app.containerName),
          ])
          return { ...app, deployStatus, containerStatus }
        }),
      ),
    )
  }
}

export const GetApps = Object.freeze(new GetAppsUseCaseClass())
```

- [ ] **Commit**

```bash
git add backend/src/domain/use-cases/apps/sync-apps/ backend/src/domain/use-cases/apps/get-apps/
git commit -m "feat(DASH-7/8): use-cases SyncApps + GetApps"
```

---

## Task 9 : Use-cases ConfigureApp + Tags + export

**Files:**
- Create: `backend/src/domain/use-cases/apps/configure-app/configure-app.use-case.ts`
- Create: `backend/src/domain/use-cases/apps/get-tags/get-tags.use-case.ts`
- Create: `backend/src/domain/use-cases/apps/create-tag/create-tag.use-case.ts`
- Modify: `backend/src/domain/use-cases/index.ts`

- [ ] **Créer backend/src/domain/use-cases/apps/configure-app/configure-app.use-case.ts**

```typescript
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
```

- [ ] **Créer backend/src/domain/use-cases/apps/get-tags/get-tags.use-case.ts**

```typescript
import { UseCase } from '../../use-case'
import { repository } from '../../../../data/repository/factory'
import type { PredefinedTagEntity } from '@entities'

class GetTagsUseCaseClass extends UseCase<PredefinedTagEntity[]> {
  async Execute(): Promise<PredefinedTagEntity[]> {
    return this.runStep('Fetch predefined tags', () => repository.tags.findAll())
  }
}

export const GetTags = Object.freeze(new GetTagsUseCaseClass())
```

- [ ] **Créer backend/src/domain/use-cases/apps/create-tag/create-tag.use-case.ts**

```typescript
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
```

- [ ] **Mettre à jour backend/src/domain/use-cases/index.ts**

```typescript
export { GetAuthStatus } from './auth/get-auth/get-auth-status.use-case'
export { GetChallenge } from './auth/get-challenge/get-challenge.use-case'
export { InitFirstAuth } from './auth/init-first-auth/init-first-auth.use-case'
export { VerifyAuth } from './auth/verify-auth/verify-auth.use-case'
export { GetLiveMetrics } from './metrics/get-live-metrics/get-live-metrics.use-case'
export { GetHistory } from './metrics/get-history/get-history.use-case'
export { GetVisits } from './visits/get-visits/get-visits.use-case'
export { SyncApps } from './apps/sync-apps/sync-apps.use-case'
export { GetApps } from './apps/get-apps/get-apps.use-case'
export { ConfigureApp } from './apps/configure-app/configure-app.use-case'
export { GetTags } from './apps/get-tags/get-tags.use-case'
export { CreateTag } from './apps/create-tag/create-tag.use-case'
```

- [ ] **Commit**

```bash
git add backend/src/domain/use-cases/apps/configure-app/ backend/src/domain/use-cases/apps/get-tags/ backend/src/domain/use-cases/apps/create-tag/ backend/src/domain/use-cases/index.ts
git commit -m "feat(DASH-8): use-cases ConfigureApp, GetTags, CreateTag"
```

---

## Task 10 : Routes backend + montage

**Files:**
- Create: `backend/src/entry-points/routes/apps.ts`
- Create: `backend/src/entry-points/routes/tags.ts`
- Modify: `backend/src/entry-points/app.ts`

- [ ] **Créer backend/src/entry-points/routes/apps.ts**

```typescript
import { Hono } from 'hono'
import { customZod } from '@libraries'
import { requireAuth } from '../middleware/require-auth'
import { SyncApps } from '../../domain/use-cases/apps/sync-apps/sync-apps.use-case'
import { GetApps } from '../../domain/use-cases/apps/get-apps/get-apps.use-case'
import {
  ConfigureApp,
  configureAppSchema,
} from '../../domain/use-cases/apps/configure-app/configure-app.use-case'

const appsRoute = new Hono().basePath('/apps')

appsRoute.use('*', requireAuth)

appsRoute.post('/sync', async (c) => {
  const apps = await SyncApps.Execute()
  return c.json(apps)
})

appsRoute.get('/', async (c) => {
  const apps = await GetApps.Execute()
  return c.json(apps)
})

appsRoute.put(
  '/:id',
  customZod.customValidator('json', configureAppSchema),
  async (c) => {
    const { id } = c.req.param()
    const data = c.req.valid('json')
    const app = await ConfigureApp.Execute(id, data)
    return c.json(app)
  },
)

export default appsRoute
```

- [ ] **Créer backend/src/entry-points/routes/tags.ts**

```typescript
import { Hono } from 'hono'
import { customZod } from '@libraries'
import { requireAuth } from '../middleware/require-auth'
import { GetTags } from '../../domain/use-cases/apps/get-tags/get-tags.use-case'
import {
  CreateTag,
  createTagSchema,
} from '../../domain/use-cases/apps/create-tag/create-tag.use-case'

const tagsRoute = new Hono().basePath('/tags')

tagsRoute.use('*', requireAuth)

tagsRoute.get('/', async (c) => {
  const tags = await GetTags.Execute()
  return c.json(tags)
})

tagsRoute.post('/', customZod.customValidator('json', createTagSchema), async (c) => {
  const data = c.req.valid('json')
  const tag = await CreateTag.Execute(data)
  return c.json(tag, 201)
})

export default tagsRoute
```

- [ ] **Mettre à jour backend/src/entry-points/app.ts**

```typescript
import config from '@config'
import { handleHttpErrors } from '@errors/handle-http-errors'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import authRoute from './routes/auth'
import metricsRoute from './routes/metrics'
import visitsRoute from './routes/visits'
import appsRoute from './routes/apps'
import tagsRoute from './routes/tags'

const app = new Hono().basePath('/api/v1')

app.use(cors({ origin: config.Server.ClientUrls, credentials: true }))
app.onError(handleHttpErrors)

app.route('/', authRoute)
app.route('/', metricsRoute)
app.route('/', visitsRoute)
app.route('/', appsRoute)
app.route('/', tagsRoute)

export default app
```

- [ ] **Vérifier le build backend**

```bash
cd backend && npm run build
```
Résultat attendu : build sans erreurs TypeScript

- [ ] **Commit**

```bash
git add backend/src/entry-points/
git commit -m "feat(DASH-7/8): routes /apps et /tags"
```

---

## Task 11 : Frontend — service + store

**Files:**
- Create: `frontend/src/services/apps.service.ts`
- Create: `frontend/src/stores/apps.store.ts`

- [ ] **Créer frontend/src/services/apps.service.ts**

```typescript
import { handle401 } from "./auth.service";

export interface PredefinedTag {
  id: string;
  category: string;
  label: string;
  color: string;
}

export interface DeployStatus {
  conclusion: "success" | "failure" | "cancelled" | "timed_out" | null;
  runAt: string | null;
}

export interface App {
  id: string;
  repoName: string;
  repoUrl: string;
  displayName: string | null;
  type: "frontend" | "backend" | "fullstack" | null;
  containerName: string | null;
  configured: boolean;
  lastSyncedAt: string | null;
  createdAt: string;
  tags: PredefinedTag[];
  deployStatus: DeployStatus | null;
  containerStatus: "running" | "stopped" | "unknown" | null;
}

export interface ConfigureAppPayload {
  displayName: string;
  type: "frontend" | "backend" | "fullstack";
  containerName: string;
  tagIds: string[];
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    handle401();
    throw new Error("Unauthorized");
  }
  if (!res.ok) throw new Error("Request failed");
  return res.json();
}

export async function syncApps(): Promise<App[]> {
  const res = await fetch("/api/v1/apps/sync", { method: "POST" });
  return handleResponse<App[]>(res);
}

export async function fetchApps(): Promise<App[]> {
  const res = await fetch("/api/v1/apps");
  return handleResponse<App[]>(res);
}

export async function configureApp(
  id: string,
  payload: ConfigureAppPayload,
): Promise<App> {
  const res = await fetch(`/api/v1/apps/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse<App>(res);
}

export async function fetchTags(): Promise<PredefinedTag[]> {
  const res = await fetch("/api/v1/tags");
  return handleResponse<PredefinedTag[]>(res);
}

export async function createTag(
  data: Omit<PredefinedTag, "id">,
): Promise<PredefinedTag> {
  const res = await fetch("/api/v1/tags", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<PredefinedTag>(res);
}
```

- [ ] **Créer frontend/src/stores/apps.store.ts**

```typescript
import { defineStore } from "pinia";
import { ref } from "vue";
import type { App, PredefinedTag, ConfigureAppPayload } from "@/services/apps.service";
import {
  syncApps,
  fetchApps,
  configureApp,
  fetchTags,
  createTag,
} from "@/services/apps.service";

export const useAppsStore = defineStore("apps", () => {
  const apps = ref<App[]>([]);
  const tags = ref<PredefinedTag[]>([]);
  const loading = ref(false);

  async function loadApps() {
    loading.value = true;
    try {
      apps.value = await fetchApps();
    } finally {
      loading.value = false;
    }
  }

  async function sync() {
    loading.value = true;
    try {
      apps.value = await syncApps();
    } finally {
      loading.value = false;
    }
  }

  async function loadTags() {
    tags.value = await fetchTags();
  }

  async function configure(id: string, payload: ConfigureAppPayload) {
    const updated = await configureApp(id, payload);
    const idx = apps.value.findIndex((a) => a.id === id);
    if (idx !== -1) apps.value[idx] = updated;
  }

  async function addTag(data: Omit<PredefinedTag, "id">): Promise<PredefinedTag> {
    const tag = await createTag(data);
    tags.value.push(tag);
    return tag;
  }

  return { apps, tags, loading, loadApps, sync, loadTags, configure, addTag };
});
```

- [ ] **Vérifier le type-check frontend**

```bash
cd frontend && npm run type-check
```
Résultat attendu : aucune erreur

- [ ] **Commit**

```bash
git add frontend/src/services/apps.service.ts frontend/src/stores/apps.store.ts
git commit -m "feat(DASH-10): service apps + store Pinia"
```

---

## Task 12 : Atom TagPill

**Files:**
- Create: `frontend/src/components/atoms/TagPill/TagPill.vue`
- Create: `frontend/src/components/atoms/TagPill/TagPill.spec.ts`

- [ ] **Écrire le test failing pour TagPill**

```typescript
// frontend/src/components/atoms/TagPill/TagPill.spec.ts
import { mount } from "@vue/test-utils";
import { describe, it, expect } from "vitest";
import TagPill from "./TagPill.vue";

describe("TagPill", () => {
  it("affiche le label", () => {
    const wrapper = mount(TagPill, {
      props: { label: "PostgreSQL", color: "#336791" },
    });
    expect(wrapper.text()).toContain("PostgreSQL");
  });

  it("applique la couleur comme variable CSS", () => {
    const wrapper = mount(TagPill, {
      props: { label: "Redis", color: "#DC382D" },
    });
    expect(wrapper.html()).toContain("#DC382D");
  });

  it("émet 'toggle' au clic en mode selectable", async () => {
    const wrapper = mount(TagPill, {
      props: { label: "Redis", color: "#DC382D", selectable: true, selected: false },
    });
    await wrapper.trigger("click");
    expect(wrapper.emitted("toggle")).toBeTruthy();
  });

  it("n'émet rien au clic si selectable est false", async () => {
    const wrapper = mount(TagPill, {
      props: { label: "Redis", color: "#DC382D", selectable: false },
    });
    await wrapper.trigger("click");
    expect(wrapper.emitted("toggle")).toBeFalsy();
  });
});
```

- [ ] **Lancer le test pour vérifier qu'il échoue**

```bash
cd frontend && npm run test:unit -- TagPill
```
Résultat attendu : `Cannot find module './TagPill.vue'`

- [ ] **Créer frontend/src/components/atoms/TagPill/TagPill.vue**

```vue
<script setup lang="ts">
defineProps<{
  label: string;
  color: string;
  selectable?: boolean;
  selected?: boolean;
}>();

const emit = defineEmits<{ toggle: [] }>();

function handleClick() {
  if (props.selectable) emit("toggle");
}

const props = defineProps<{
  label: string;
  color: string;
  selectable?: boolean;
  selected?: boolean;
}>();
</script>

<template>
  <span
    class="tag-pill"
    :class="{ 'tag-pill--selected': selected, 'tag-pill--selectable': selectable }"
    :style="{ '--tag-color': color }"
    @click="handleClick"
  >
    {{ label }}
  </span>
</template>

<style scoped>
.tag-pill {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-family: var(--font-display);
  background: color-mix(in srgb, var(--tag-color) 20%, transparent);
  color: color-mix(in srgb, var(--tag-color) 80%, white);
  border: 1px solid color-mix(in srgb, var(--tag-color) 35%, transparent);
  transition: opacity 0.15s;
}
.tag-pill--selectable {
  cursor: pointer;
}
.tag-pill--selectable:not(.tag-pill--selected) {
  opacity: 0.4;
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.4);
  border-color: rgba(255, 255, 255, 0.12);
}
.tag-pill--selectable:hover {
  opacity: 1;
}
</style>
```

**Attention :** `defineProps` est appelé deux fois dans le template ci-dessus — c'est une erreur. Voici la version corrigée :

```vue
<script setup lang="ts">
const props = defineProps<{
  label: string;
  color: string;
  selectable?: boolean;
  selected?: boolean;
}>();

const emit = defineEmits<{ toggle: [] }>();

function handleClick() {
  if (props.selectable) emit("toggle");
}
</script>

<template>
  <span
    class="tag-pill"
    :class="{ 'tag-pill--selected': props.selected, 'tag-pill--selectable': props.selectable }"
    :style="{ '--tag-color': props.color }"
    @click="handleClick"
  >
    {{ props.label }}
  </span>
</template>

<style scoped>
.tag-pill {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-family: var(--font-display);
  background: color-mix(in srgb, var(--tag-color) 20%, transparent);
  color: color-mix(in srgb, var(--tag-color) 80%, white);
  border: 1px solid color-mix(in srgb, var(--tag-color) 35%, transparent);
  transition: opacity 0.15s;
}
.tag-pill--selectable {
  cursor: pointer;
}
.tag-pill--selectable:not(.tag-pill--selected) {
  opacity: 0.4;
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.4);
  border-color: rgba(255, 255, 255, 0.12);
}
.tag-pill--selectable:hover {
  opacity: 1;
}
</style>
```

- [ ] **Lancer les tests pour vérifier qu'ils passent**

```bash
cd frontend && npm run test:unit -- TagPill
```
Résultat attendu : `4 passed`

- [ ] **Commit**

```bash
git add frontend/src/components/atoms/TagPill/
git commit -m "feat(DASH-10): atom TagPill"
```

---

## Task 13 : Molecule AppRow

**Files:**
- Create: `frontend/src/components/molecules/AppRow/AppRow.vue`
- Create: `frontend/src/components/molecules/AppRow/AppRow.spec.ts`

- [ ] **Écrire le test failing pour AppRow**

```typescript
// frontend/src/components/molecules/AppRow/AppRow.spec.ts
import { mount } from "@vue/test-utils";
import { describe, it, expect } from "vitest";
import AppRow from "./AppRow.vue";
import type { App } from "@/services/apps.service";

const configuredApp: App = {
  id: "1",
  repoName: "my-app",
  repoUrl: "https://github.com/voikyrioh/my-app",
  displayName: "My App",
  type: "backend",
  containerName: "my-app",
  configured: true,
  lastSyncedAt: null,
  createdAt: "2026-01-01",
  tags: [{ id: "t1", category: "database", label: "PostgreSQL", color: "#336791" }],
  deployStatus: { conclusion: "success", runAt: null },
  containerStatus: "running",
};

const unconfiguredApp: App = {
  ...configuredApp,
  displayName: null,
  type: null,
  containerName: null,
  configured: false,
  tags: [],
  deployStatus: null,
  containerStatus: null,
};

describe("AppRow", () => {
  it("affiche le displayName si configurée", () => {
    const wrapper = mount(AppRow, { props: { app: configuredApp } });
    expect(wrapper.text()).toContain("My App");
  });

  it("affiche le repoName si non configurée", () => {
    const wrapper = mount(AppRow, { props: { app: unconfiguredApp } });
    expect(wrapper.text()).toContain("my-app");
  });

  it("affiche le badge 'À configurer' si non configurée", () => {
    const wrapper = mount(AppRow, { props: { app: unconfiguredApp } });
    expect(wrapper.text()).toContain("À configurer");
  });

  it("affiche le tag PostgreSQL si configurée", () => {
    const wrapper = mount(AppRow, { props: { app: configuredApp } });
    expect(wrapper.text()).toContain("PostgreSQL");
  });

  it("émet 'configure' au clic si non configurée", async () => {
    const wrapper = mount(AppRow, { props: { app: unconfiguredApp } });
    await wrapper.trigger("click");
    expect(wrapper.emitted("configure")).toBeTruthy();
  });
});
```

- [ ] **Lancer le test pour vérifier qu'il échoue**

```bash
cd frontend && npm run test:unit -- AppRow
```
Résultat attendu : `Cannot find module './AppRow.vue'`

- [ ] **Créer frontend/src/components/molecules/AppRow/AppRow.vue**

```vue
<script setup lang="ts">
import TagPill from "@/components/atoms/TagPill/TagPill.vue";
import type { App } from "@/services/apps.service";

const props = defineProps<{ app: App }>();
const emit = defineEmits<{ configure: [] }>();

const typeColors: Record<string, string> = {
  frontend: "rgba(52,211,153,0.15)",
  backend: "rgba(139,92,246,0.15)",
  fullstack: "rgba(52,211,153,0.15)",
};
const typeTextColors: Record<string, string> = {
  frontend: "#34d399",
  backend: "#a78bfa",
  fullstack: "#34d399",
};

const statusDot: Record<string, string> = {
  success: "#34d399",
  running: "#34d399",
  failure: "#ef4444",
  stopped: "#6b7280",
  unknown: "#6b7280",
  cancelled: "#f59e0b",
  timed_out: "#ef4444",
  in_progress: "#60a5fa",
};

function handleClick() {
  if (!props.app.configured) emit("configure");
}
</script>

<template>
  <div
    class="app-row"
    :class="{ 'app-row--unconfigured': !app.configured }"
    @click="handleClick"
  >
    <!-- Application -->
    <div class="app-row__name">
      <span class="app-row__display">
        {{ app.displayName ?? app.repoName }}
      </span>
      <a
        :href="app.repoUrl"
        target="_blank"
        rel="noopener"
        class="app-row__repo"
        @click.stop
      >
        {{ app.repoUrl.replace("https://github.com/", "") }}
      </a>
    </div>

    <!-- Type -->
    <div class="app-row__type">
      <span
        v-if="app.type"
        class="app-row__badge"
        :style="{
          background: typeColors[app.type],
          color: typeTextColors[app.type],
        }"
      >
        {{ app.type }}
      </span>
      <span v-else class="app-row__dash">—</span>
    </div>

    <!-- Tags -->
    <div class="app-row__tags">
      <span v-if="!app.configured" class="app-row__unconfigured-badge">
        ⚙ À configurer
      </span>
      <template v-else>
        <TagPill
          v-for="tag in app.tags"
          :key="tag.id"
          :label="tag.label"
          :color="tag.color"
        />
        <span v-if="app.tags.length === 0" class="app-row__dash">—</span>
      </template>
    </div>

    <!-- Deploy -->
    <div class="app-row__status">
      <template v-if="app.deployStatus">
        <span
          class="app-row__dot"
          :style="{ background: statusDot[app.deployStatus.conclusion ?? 'unknown'] }"
        />
        <span class="app-row__status-label">
          {{ app.deployStatus.conclusion === 'success' ? 'OK' : app.deployStatus.conclusion === 'failure' ? 'KO' : app.deployStatus.conclusion }}
        </span>
      </template>
      <span v-else class="app-row__dash">—</span>
    </div>

    <!-- Container -->
    <div class="app-row__status">
      <template v-if="app.containerStatus">
        <span
          class="app-row__dot"
          :style="{ background: statusDot[app.containerStatus] }"
        />
        <span class="app-row__status-label">
          {{ app.containerStatus === 'running' ? 'Running' : app.containerStatus === 'stopped' ? 'Stopped' : 'Unknown' }}
        </span>
      </template>
      <span v-else class="app-row__dash">—</span>
    </div>
  </div>
</template>

<style scoped>
.app-row {
  display: grid;
  grid-template-columns: 2fr 1fr 2fr 100px 100px;
  gap: 12px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 8px;
  align-items: center;
  transition: background 0.15s;
}
.app-row--unconfigured {
  background: rgba(255, 255, 255, 0.02);
  border: 1px dashed rgba(245, 158, 11, 0.3);
  cursor: pointer;
}
.app-row--unconfigured:hover {
  background: rgba(245, 158, 11, 0.05);
}
.app-row__name {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.app-row__display {
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 600;
  color: #f1f5f9;
}
.app-row--unconfigured .app-row__display {
  color: rgba(255, 255, 255, 0.4);
}
.app-row__repo {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.3);
  text-decoration: none;
  font-family: var(--font-display);
}
.app-row__repo:hover {
  color: rgba(255, 255, 255, 0.6);
}
.app-row__badge {
  display: inline-block;
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 4px;
  font-family: var(--font-display);
}
.app-row__unconfigured-badge {
  font-size: 11px;
  color: #fbbf24;
}
.app-row__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}
.app-row__status {
  display: flex;
  align-items: center;
  gap: 5px;
}
.app-row__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}
.app-row__status-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
}
.app-row__dash {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.2);
}
</style>
```

- [ ] **Lancer les tests pour vérifier qu'ils passent**

```bash
cd frontend && npm run test:unit -- AppRow
```
Résultat attendu : `5 passed`

- [ ] **Commit**

```bash
git add frontend/src/components/molecules/AppRow/
git commit -m "feat(DASH-10): molecule AppRow"
```

---

## Task 14 : Molecule AppConfigModal

**Files:**
- Create: `frontend/src/components/molecules/AppConfigModal/AppConfigModal.vue`
- Create: `frontend/src/components/molecules/AppConfigModal/AppConfigModal.spec.ts`

- [ ] **Écrire le test failing pour AppConfigModal**

```typescript
// frontend/src/components/molecules/AppConfigModal/AppConfigModal.spec.ts
import { mount } from "@vue/test-utils";
import { describe, it, expect } from "vitest";
import AppConfigModal from "./AppConfigModal.vue";
import type { App, PredefinedTag } from "@/services/apps.service";

const app: App = {
  id: "1",
  repoName: "my-app",
  repoUrl: "https://github.com/voikyrioh/my-app",
  displayName: null,
  type: null,
  containerName: null,
  configured: false,
  lastSyncedAt: null,
  createdAt: "2026-01-01",
  tags: [],
  deployStatus: null,
  containerStatus: null,
};

const tags: PredefinedTag[] = [
  { id: "t1", category: "database", label: "PostgreSQL", color: "#336791" },
  { id: "t2", category: "database", label: "Redis", color: "#DC382D" },
];

describe("AppConfigModal", () => {
  it("affiche le nom du repo dans le header", () => {
    const wrapper = mount(AppConfigModal, {
      props: { app, tags, modelValue: true },
    });
    expect(wrapper.text()).toContain("voikyrioh/my-app");
  });

  it("affiche les tags disponibles", () => {
    const wrapper = mount(AppConfigModal, {
      props: { app, tags, modelValue: true },
    });
    expect(wrapper.text()).toContain("PostgreSQL");
    expect(wrapper.text()).toContain("Redis");
  });

  it("émet 'update:modelValue' false au clic Annuler", async () => {
    const wrapper = mount(AppConfigModal, {
      props: { app, tags, modelValue: true },
    });
    await wrapper.find("[data-testid='cancel']").trigger("click");
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([false]);
  });

  it("émet 'submit' avec le payload au clic Enregistrer", async () => {
    const wrapper = mount(AppConfigModal, {
      props: { app, tags, modelValue: true },
    });
    await wrapper.find("[data-testid='input-name']").setValue("My App");
    await wrapper.find("[data-testid='type-backend']").trigger("click");
    await wrapper.find("[data-testid='input-container']").setValue("my-app");
    await wrapper.find("[data-testid='save']").trigger("click");
    const emitted = wrapper.emitted("submit")?.[0]?.[0] as any;
    expect(emitted.displayName).toBe("My App");
    expect(emitted.type).toBe("backend");
    expect(emitted.containerName).toBe("my-app");
    expect(emitted.tagIds).toEqual([]);
  });
});
```

- [ ] **Lancer le test pour vérifier qu'il échoue**

```bash
cd frontend && npm run test:unit -- AppConfigModal
```
Résultat attendu : `Cannot find module './AppConfigModal.vue'`

- [ ] **Créer frontend/src/components/molecules/AppConfigModal/AppConfigModal.vue**

```vue
<script setup lang="ts">
import { ref, watch } from "vue";
import TagPill from "@/components/atoms/TagPill/TagPill.vue";
import type { App, PredefinedTag, ConfigureAppPayload } from "@/services/apps.service";

const props = defineProps<{
  app: App;
  tags: PredefinedTag[];
  modelValue: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  submit: [payload: ConfigureAppPayload];
  "add-tag": [data: { category: string; label: string; color: string }];
}>();

const displayName = ref(props.app.displayName ?? "");
const type = ref<"frontend" | "backend" | "fullstack" | null>(props.app.type);
const containerName = ref(props.app.containerName ?? "");
const selectedTagIds = ref<string[]>(props.app.tags.map((t) => t.id));
const showNewTagForm = ref(false);
const newTagLabel = ref("");
const newTagColor = ref("#6366f1");

watch(
  () => props.app,
  (app) => {
    displayName.value = app.displayName ?? "";
    type.value = app.type;
    containerName.value = app.containerName ?? "";
    selectedTagIds.value = app.tags.map((t) => t.id);
  },
);

function toggleTag(tagId: string) {
  const idx = selectedTagIds.value.indexOf(tagId);
  if (idx === -1) selectedTagIds.value.push(tagId);
  else selectedTagIds.value.splice(idx, 1);
}

function cancel() {
  emit("update:modelValue", false);
}

function save() {
  if (!type.value) return;
  emit("submit", {
    displayName: displayName.value,
    type: type.value,
    containerName: containerName.value,
    tagIds: selectedTagIds.value,
  });
  emit("update:modelValue", false);
}
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-overlay" @click.self="cancel">
      <div class="modal">
        <div class="modal__header">
          <div>
            <div class="modal__title">Configurer l'application</div>
            <div class="modal__repo">{{ app.repoUrl.replace("https://github.com/", "") }}</div>
          </div>
          <button class="modal__close" @click="cancel">✕</button>
        </div>

        <div class="modal__body">
          <label class="modal__label">Nom affiché</label>
          <input
            v-model="displayName"
            class="modal__input"
            data-testid="input-name"
            placeholder="ex: Mon Application"
          />

          <label class="modal__label">Type</label>
          <div class="modal__type-group">
            <button
              v-for="t in ['frontend', 'backend', 'fullstack']"
              :key="t"
              class="modal__type-btn"
              :class="{ 'modal__type-btn--active': type === t }"
              :data-testid="`type-${t}`"
              @click="type = t as 'frontend' | 'backend' | 'fullstack'"
            >
              {{ t.charAt(0).toUpperCase() + t.slice(1) }}
            </button>
          </div>

          <label class="modal__label">Nom du container Docker</label>
          <input
            v-model="containerName"
            class="modal__input"
            data-testid="input-container"
            placeholder="ex: my-app"
          />

          <label class="modal__label">Tags</label>
          <div class="modal__tags">
            <TagPill
              v-for="tag in tags"
              :key="tag.id"
              :label="tag.label"
              :color="tag.color"
              :selectable="true"
              :selected="selectedTagIds.includes(tag.id)"
              @toggle="toggleTag(tag.id)"
            />
            <button class="modal__new-tag-btn" @click="showNewTagForm = !showNewTagForm">
              + Nouveau tag
            </button>
          </div>

          <div v-if="showNewTagForm" class="modal__new-tag-form">
            <input v-model="newTagLabel" class="modal__input" placeholder="Nom du tag" />
            <input v-model="newTagColor" type="color" class="modal__color-input" />
            <button
              class="modal__add-btn"
              @click="$emit('add-tag', { category: 'database', label: newTagLabel, color: newTagColor }); showNewTagForm = false; newTagLabel = ''"
            >
              Ajouter
            </button>
          </div>
        </div>

        <div class="modal__footer">
          <button class="modal__btn modal__btn--cancel" data-testid="cancel" @click="cancel">
            Annuler
          </button>
          <button class="modal__btn modal__btn--save" data-testid="save" @click="save">
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
  z-index: 50;
}
.modal {
  background: #1e293b;
  border: 1px solid rgba(52, 211, 153, 0.25);
  border-radius: 14px;
  width: 460px;
  padding: 28px;
  box-shadow: 0 0 40px rgba(52, 211, 153, 0.1);
}
.modal__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}
.modal__title {
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 700;
  color: #f1f5f9;
}
.modal__repo {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.35);
  font-family: var(--font-display);
  margin-top: 3px;
}
.modal__close {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.3);
  cursor: pointer;
  font-size: 18px;
}
.modal__body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.modal__label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: block;
  margin-bottom: -10px;
}
.modal__input {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 13px;
  color: #f1f5f9;
  font-family: var(--font-display);
  width: 100%;
  box-sizing: border-box;
  outline: none;
}
.modal__input:focus {
  border-color: rgba(52, 211, 153, 0.4);
}
.modal__type-group {
  display: flex;
  gap: 8px;
}
.modal__type-btn {
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  transition: all 0.15s;
}
.modal__type-btn--active {
  background: rgba(52, 211, 153, 0.15);
  border-color: rgba(52, 211, 153, 0.4);
  color: #34d399;
  font-weight: 600;
}
.modal__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}
.modal__new-tag-btn {
  font-size: 11px;
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.3);
  border: 1px dashed rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 4px 10px;
  cursor: pointer;
}
.modal__new-tag-form {
  display: flex;
  gap: 8px;
  align-items: center;
}
.modal__color-input {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  padding: 0;
}
.modal__add-btn {
  background: rgba(52, 211, 153, 0.15);
  border: 1px solid rgba(52, 211, 153, 0.3);
  color: #34d399;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
}
.modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 24px;
}
.modal__btn {
  padding: 8px 18px;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
}
.modal__btn--cancel {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.5);
}
.modal__btn--save {
  background: rgba(52, 211, 153, 0.2);
  border: 1px solid rgba(52, 211, 153, 0.5);
  color: #34d399;
  font-weight: 600;
}
</style>
```

- [ ] **Lancer les tests pour vérifier qu'ils passent**

```bash
cd frontend && npm run test:unit -- AppConfigModal
```
Résultat attendu : `4 passed`

- [ ] **Commit**

```bash
git add frontend/src/components/molecules/AppConfigModal/
git commit -m "feat(DASH-10): molecule AppConfigModal"
```

---

## Task 15 : Page ApplicationsPage + route

**Files:**
- Create: `frontend/src/components/pages/ApplicationsPage/ApplicationsPage.vue`
- Create: `frontend/src/components/pages/ApplicationsPage/ApplicationsPage.spec.ts`
- Modify: `frontend/src/router/index.ts`

- [ ] **Écrire le test failing pour ApplicationsPage**

```typescript
// frontend/src/components/pages/ApplicationsPage/ApplicationsPage.spec.ts
import { mount } from "@vue/test-utils";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import ApplicationsPage from "./ApplicationsPage.vue";
import * as appsService from "@/services/apps.service";

describe("ApplicationsPage", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("affiche le titre 'Applications'", async () => {
    vi.spyOn(appsService, "fetchApps").mockResolvedValue([]);
    vi.spyOn(appsService, "fetchTags").mockResolvedValue([]);
    const wrapper = mount(ApplicationsPage);
    expect(wrapper.text()).toContain("Applications");
  });

  it("affiche le bouton Synchroniser", () => {
    vi.spyOn(appsService, "fetchApps").mockResolvedValue([]);
    vi.spyOn(appsService, "fetchTags").mockResolvedValue([]);
    const wrapper = mount(ApplicationsPage);
    expect(wrapper.text()).toContain("Synchroniser");
  });

  it("affiche le header du tableau", async () => {
    vi.spyOn(appsService, "fetchApps").mockResolvedValue([]);
    vi.spyOn(appsService, "fetchTags").mockResolvedValue([]);
    const wrapper = mount(ApplicationsPage);
    expect(wrapper.text()).toContain("Application");
    expect(wrapper.text()).toContain("Deploy");
    expect(wrapper.text()).toContain("Container");
  });
});
```

- [ ] **Lancer le test pour vérifier qu'il échoue**

```bash
cd frontend && npm run test:unit -- ApplicationsPage
```
Résultat attendu : `Cannot find module './ApplicationsPage.vue'`

- [ ] **Créer frontend/src/components/pages/ApplicationsPage/ApplicationsPage.vue**

```vue
<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useAppsStore } from "@/stores/apps.store";
import AppRow from "@/components/molecules/AppRow/AppRow.vue";
import AppConfigModal from "@/components/molecules/AppConfigModal/AppConfigModal.vue";
import type { App } from "@/services/apps.service";

const store = useAppsStore();
const modalOpen = ref(false);
const selectedApp = ref<App | null>(null);

onMounted(async () => {
  await Promise.all([store.loadApps(), store.loadTags()]);
});

function openConfigure(app: App) {
  selectedApp.value = app;
  modalOpen.value = true;
}

async function handleSubmit(payload: any) {
  if (!selectedApp.value) return;
  await store.configure(selectedApp.value.id, payload);
}

async function handleAddTag(data: any) {
  await store.addTag(data);
}
</script>

<template>
  <div class="applications-page">
    <div class="applications-page__header">
      <h1 class="applications-page__title neon-text-emerald font-display">
        Applications
      </h1>
      <button
        class="applications-page__sync-btn"
        :disabled="store.loading"
        @click="store.sync()"
      >
        ↻ Synchroniser
      </button>
    </div>

    <div class="applications-page__table">
      <div class="applications-page__table-header">
        <span>Application</span>
        <span>Type</span>
        <span>Tags</span>
        <span>Deploy</span>
        <span>Container</span>
      </div>

      <div v-if="store.loading" class="applications-page__loading">
        Chargement…
      </div>

      <template v-else>
        <AppRow
          v-for="app in store.apps"
          :key="app.id"
          :app="app"
          @configure="openConfigure(app)"
        />
        <div v-if="store.apps.length === 0" class="applications-page__empty">
          Aucune application. Clique sur Synchroniser pour détecter les apps GitHub.
        </div>
      </template>
    </div>

    <AppConfigModal
      v-if="selectedApp"
      v-model="modalOpen"
      :app="selectedApp"
      :tags="store.tags"
      @submit="handleSubmit"
      @add-tag="handleAddTag"
    />
  </div>
</template>

<style scoped>
.applications-page {
  padding: 32px;
  max-width: 1200px;
  margin: 0 auto;
}
.applications-page__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.applications-page__title {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
}
.applications-page__sync-btn {
  background: rgba(52, 211, 153, 0.15);
  border: 1px solid rgba(52, 211, 153, 0.4);
  color: #34d399;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-family: var(--font-display);
  cursor: pointer;
  transition: background 0.15s;
}
.applications-page__sync-btn:hover {
  background: rgba(52, 211, 153, 0.25);
}
.applications-page__sync-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.applications-page__table {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.applications-page__table-header {
  display: grid;
  grid-template-columns: 2fr 1fr 2fr 100px 100px;
  gap: 12px;
  padding: 8px 12px;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.3);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-family: var(--font-display);
}
.applications-page__loading,
.applications-page__empty {
  padding: 32px 12px;
  text-align: center;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.3);
}
</style>
```

- [ ] **Lancer les tests pour vérifier qu'ils passent**

```bash
cd frontend && npm run test:unit -- ApplicationsPage
```
Résultat attendu : `3 passed`

- [ ] **Ajouter la route /applications dans frontend/src/router/index.ts**

Ajouter dans le tableau `routes` :
```typescript
{
  path: "/applications",
  component: () =>
    import("@/components/pages/ApplicationsPage/ApplicationsPage.vue"),
},
```

- [ ] **Commit**

```bash
git add frontend/src/components/pages/ApplicationsPage/ frontend/src/router/index.ts
git commit -m "feat(DASH-10): page ApplicationsPage + route /applications"
```

---

## Task 16 : Tests E2E Playwright

**Files:**
- Create: `frontend/e2e/applications.spec.ts`

- [ ] **Écrire les tests E2E**

```typescript
// frontend/e2e/applications.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Page Applications", () => {
  test.beforeEach(async ({ page }) => {
    // Mock auth + API
    await page.route("/api/v1/auth/status", (route) =>
      route.fulfill({
        json: { status: "connected" },
      }),
    );
    await page.route("/api/v1/apps", (route) =>
      route.fulfill({
        json: [
          {
            id: "1",
            repoName: "my-app",
            repoUrl: "https://github.com/voikyrioh/my-app",
            displayName: "My App",
            type: "backend",
            containerName: "my-app",
            configured: true,
            lastSyncedAt: null,
            createdAt: "2026-01-01",
            tags: [{ id: "t1", category: "database", label: "PostgreSQL", color: "#336791" }],
            deployStatus: { conclusion: "success", runAt: null },
            containerStatus: "running",
          },
          {
            id: "2",
            repoName: "unconfigured-app",
            repoUrl: "https://github.com/voikyrioh/unconfigured-app",
            displayName: null,
            type: null,
            containerName: null,
            configured: false,
            lastSyncedAt: null,
            createdAt: "2026-01-01",
            tags: [],
            deployStatus: null,
            containerStatus: null,
          },
        ],
      }),
    );
    await page.route("/api/v1/tags", (route) =>
      route.fulfill({
        json: [
          { id: "t1", category: "database", label: "PostgreSQL", color: "#336791" },
          { id: "t2", category: "database", label: "Redis", color: "#DC382D" },
        ],
      }),
    );
  });

  test("affiche la liste des applications", async ({ page }) => {
    await page.goto("/applications");
    await expect(page.getByText("Applications")).toBeVisible();
    await expect(page.getByText("My App")).toBeVisible();
    await expect(page.getByText("unconfigured-app")).toBeVisible();
  });

  test("affiche le badge 'À configurer' pour une app non configurée", async ({ page }) => {
    await page.goto("/applications");
    await expect(page.getByText("À configurer")).toBeVisible();
  });

  test("affiche les états live pour une app configurée", async ({ page }) => {
    await page.goto("/applications");
    await expect(page.getByText("OK")).toBeVisible();
    await expect(page.getByText("Running")).toBeVisible();
  });

  test("ouvre la modale au clic sur une app non configurée", async ({ page }) => {
    await page.goto("/applications");
    await page.getByText("unconfigured-app").click();
    await expect(page.getByText("Configurer l'application")).toBeVisible();
  });

  test("bouton Synchroniser déclenche POST /api/v1/apps/sync", async ({ page }) => {
    let syncCalled = false;
    await page.route("/api/v1/apps/sync", (route) => {
      syncCalled = true;
      route.fulfill({ json: [] });
    });
    await page.goto("/applications");
    await page.getByText("Synchroniser").click();
    await expect(() => expect(syncCalled).toBe(true)).toPass();
  });

  test("soumettre la modale appelle PUT /api/v1/apps/:id", async ({ page }) => {
    let configureCalled = false;
    await page.route("/api/v1/apps/2", (route) => {
      configureCalled = true;
      route.fulfill({
        json: {
          id: "2",
          repoName: "unconfigured-app",
          repoUrl: "https://github.com/voikyrioh/unconfigured-app",
          displayName: "Unconfigured App",
          type: "backend",
          containerName: "unconfigured-app",
          configured: true,
          lastSyncedAt: null,
          createdAt: "2026-01-01",
          tags: [],
          deployStatus: null,
          containerStatus: "unknown",
        },
      });
    });

    await page.goto("/applications");
    await page.getByText("unconfigured-app").click();
    await page.getByTestId("input-name").fill("Unconfigured App");
    await page.getByTestId("type-backend").click();
    await page.getByTestId("input-container").fill("unconfigured-app");
    await page.getByTestId("save").click();
    await expect(() => expect(configureCalled).toBe(true)).toPass();
  });
});
```

- [ ] **Lancer les tests E2E**

```bash
cd frontend && npm run test:e2e -- applications
```
Résultat attendu : `6 passed`

- [ ] **Commit final**

```bash
git add frontend/e2e/applications.spec.ts
git commit -m "test(DASH-10): tests E2E page Applications"
```
