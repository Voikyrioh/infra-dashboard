import { expect } from 'chai'
import Config from '@config'
import { searchAppsOnGitHub } from '../github/github-search.service'
import { getLastDeployStatus } from '../github/github-actions.service'

process.env.GITHUB_TOKEN = 'test-token'

const originalFetch = global.fetch
let originalToken: string | null

before(() => {
  originalToken = Config.Server.GitHubToken
  ;(Config.Server as any).GitHubToken = 'test-token'
})

after(() => {
  ;(Config.Server as any).GitHubToken = originalToken
})

function mockFetch(response: Partial<Response>) {
  global.fetch = async () => response as Response
}

// Le service liste apps/*.yml du repo infra puis fetch chaque fichier (base64).
function mockInfraContents(files: Record<string, string>) {
  const listing = Object.keys(files).map((name) => ({ name, type: 'file' }))
  global.fetch = (async (url: unknown) => {
    const u = String(url)
    const fileName = Object.keys(files).find((name) => u.endsWith(`/contents/apps/${name}`))
    if (fileName) {
      return {
        ok: true,
        json: async () => ({
          name: fileName,
          type: 'file',
          encoding: 'base64',
          content: Buffer.from(files[fileName]!).toString('base64'),
        }),
      } as Response
    }
    if (u.endsWith('/contents/apps')) {
      return { ok: true, json: async () => listing } as Response
    }
    return { ok: false, status: 404 } as Response
  }) as typeof fetch
}

afterEach(() => {
  global.fetch = originalFetch
})

describe('github-search.service', () => {
  it('retourne les apps déclarées dans apps/*.yml du repo infra', async () => {
    mockInfraContents({
      'my-app.yml':
        'name: my-app\ngithub_repo: voikyrioh/my-app\nimage: ghcr.io/voikyrioh/my-app\n',
      'other-app.yml':
        'name: other-app\ngithub_repo: voikyrioh/other-app\nimage: ghcr.io/voikyrioh/other-app\n',
    })
    const results = await searchAppsOnGitHub()
    expect(results).to.have.length(2)
    expect(results[0]).to.deep.equal({
      appName: 'my-app',
      repoName: 'my-app',
      repoUrl: 'https://github.com/voikyrioh/my-app',
      imageName: 'my-app',
    })
  })

  it('exclut la fiche example et le repo dashboard lui-même', async () => {
    mockInfraContents({
      'example.yml':
        'name: example\ngithub_repo: voikyrioh/example\nimage: ghcr.io/voikyrioh/example\n',
      'dashboard.yml': `name: ${Config.Server.GitHubRepo}\ngithub_repo: voikyrioh/dashboard\nimage: ghcr.io/voikyrioh/dashboard-api\n`,
      'my-app.yml':
        'name: my-app\ngithub_repo: voikyrioh/my-app\nimage: ghcr.io/voikyrioh/my-app\n',
    })
    const results = await searchAppsOnGitHub()
    expect(results).to.have.length(1)
    expect(results[0]!.repoName).to.equal('my-app')
    expect(results[0]!.repoUrl).to.equal('https://github.com/voikyrioh/my-app')
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
