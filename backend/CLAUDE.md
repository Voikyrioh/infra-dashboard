# Dashboard Backend — CLAUDE.md

## Stack

- **Hono** (framework HTTP) + `@hono/node-server`
- **TypeScript** strict, `zod` v4 pour la validation
- **PostgreSQL** via `postgres` (tagged templates, pas d'ORM)
- **@simplewebauthn/server** pour WebAuthn/Passkey
- **argon2** pour le hashing de mots de passe
- **pino** pour les logs

## Architecture DDD — couches

```
src/
├── domain/          # Logique métier pure (entités, use-cases)
├── data/            # Accès données (resources, repositories, DAO)
├── entry-points/    # HTTP (routes Hono, middleware)
└── config/          # Configuration environnement
libraries/           # Libs transversales (logger, erreurs, validators)
```

### domain/

- **entities/** : schémas Zod + types TypeScript (`AccountEntity`, `PasskeyEntity`)
- **use-cases/** : classes étendant `UseCase<T>`, exportées comme singletons frozen

### data/

- **database/postgres/models/** : types DB bruts (snake_case, pas de logique)
- **database/postgres/resources/** : requêtes SQL directes, une classe par table
- **repository/repositories/dao/** : coercion `Model → Entity` via Zod `safeParse`
- **repository/repositories/** : logique métier-niveau données, utilise resources + DAO
- **repository/factory.ts** : singleton `RepositoryFactory` exposant tous les repos

### entry-points/

- **routes/** : fichiers Hono par domaine, validation via `customZod.customValidator`
- **app.ts** : CORS, error handler global, montage des routes sous `/api/v1`

## Pattern use-case

```typescript
class MyUseCase extends UseCase<ReturnType> {
  async Execute(...args) {
    const result = await this.runStep('Step name', myServiceFn.bind(this, args))
    return result
  }
}
export const MyUseCase = Object.freeze(new MyUseCaseClass())
```

- Les fonctions de service sont dans un fichier `*.service.ts` séparé (fonctions pures)
- `runStep()` log chaque étape en debug
- Singleton frozen exposé comme export nommé

## Pattern erreurs

```typescript
throw new AppError('unauthorized', 'Message utilisateur')
// Types : 'no-data' | 'not-found' | 'invalid-payload' | 'unauthorized' | 'internal-server-error'
```

- `AppError` mappe automatiquement vers le code HTTP via `toHttpCode()`
- `handleHttpErrors` (Hono `onError`) intercepte tout et retourne la bonne réponse HTTP
- Les erreurs Zod → 400, AppError → son code HTTP, autres → 500

## Pattern DAO (Model → Entity)

```typescript
export function assertAndCoerceXxxModelToEntity(model: XxxModel): XxxEntity {
  const parse = entitySchema.safeParse({ ...mapped fields... })
  if (!parse.success) {
    logger.error(parse.error.message)
    throw new AppError('internal-server-error', 'Internal server error')
  }
  return parse.data
}
```

## Pattern ressources (SQL)

```typescript
const [row] = await pg.sql<Model[]>`SELECT * FROM table WHERE id = ${id} LIMIT 1`
if (!row) throw new AppError('not-found', 'Not found')
return row
```

- Utilise le client `postgres` avec tagged templates (protection injection automatique)
- Chaque ressource est un singleton frozen : `Object.freeze(new XxxResource())`

## Pattern config

```typescript
Config.Server.InitPassword   // string
Config.Postgres.Host         // string
```

- Chaque paramètre a un validateur Zod + defaults par environnement (`_`, `production`)
- `generateConfig()` construit le tout et le freeze
- En production : tout passe par variables d'environnement (aucun default sensible)

## Validation des routes

```typescript
authRoute.put('/', customZod.customValidator('json', mySchema), async (c) => {
  const data = c.req.valid('json')  // Typé automatiquement
  return c.json(await MyUseCase.Execute(data))
})
```

- `customValidator` wraps `@hono/zod-validator` avec le format d'erreur `{ errors: [{field, code}] }`

## Aliases TypeScript

| Alias       | Chemin                                  |
|-------------|------------------------------------------|
| `@config`   | `src/config`                             |
| `@entities` | `src/domain/entities`                    |
| `@logger`   | `libraries/logger`                       |
| `@errors`   | `libraries/errors`                       |
| `@libraries`| `libraries`                              |

## Auth WebAuthn

- `@simplewebauthn/server` pour génération des options et vérification
- RP configuré dans `src/domain/entities/rp.class.ts` (`rpName`, `rpID`, `origin`)
- Challenge stocké in-memory (Map TTL 5 min) dans `src/domain/use-cases/auth/challenge.store.ts`
- 3 états : `need-first-auth` → `need-auth` → `connected`

## JWT

- HS256 via `hono/jwt` (`sign`)
- Secret : `Config.Server.SigningKey` (variable `PRIVATE_KEY`)
- Durée : `Config.Server.JwtExpiresMs` (variable `JWT_EXPIRATION_TIME_MS`)
- Payload : `{ sub: accountId, role: 'owner', iat, exp }`

## Conventions de nommage

| Élément         | Convention                                |
|-----------------|-------------------------------------------|
| Classes         | PascalCase                                |
| Fichiers        | kebab-case                                |
| Fonctions/vars  | camelCase                                 |
| Constantes      | camelCase (ex: `rpID`, `rpName`)         |
| Types/interfaces| PascalCase + suffixe (`Entity`, `Model`)  |
| DB colonnes     | snake_case                                |

## Commandes

```bash
npm run dev       # Démarrage avec watch (tsx)
npm run build     # Build production (esbuild via build.mjs)
npm run start     # Démarrage production
npm run migrate   # Migrations DB (db-migrate)
npm run lint      # Biome lint
npm run format    # Biome format --write
```
