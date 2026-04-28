import { expect } from 'chai'
import { searchAppsOnGitHub } from '../github/github-search.service'
import { getLastDeployStatus } from '../github/github-actions.service'

process.env.GITHUB_TOKEN = 'test-token'

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
