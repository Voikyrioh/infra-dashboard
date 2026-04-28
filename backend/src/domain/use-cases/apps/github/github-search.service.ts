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
