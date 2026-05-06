import Config from '@config'
import { AppError } from '@errors/app.error'

export async function triggerDeploy(appName: string, version: string): Promise<void> {
  const token = Config.Server.GitHubToken
  if (!token) throw new AppError('internal-server-error', 'GITHUB_TOKEN not configured')

  const owner = Config.Server.GitHubOwner
  const infraRepo = Config.Server.GitHubInfraRepo

  const res = await fetch(
    `https://api.github.com/repos/${owner}/${infraRepo}/actions/workflows/deploy-version.yml/dispatches`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ref: 'main', inputs: { app_name: appName, version } }),
    },
  )
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new AppError('internal-server-error', `Failed to trigger deploy (${res.status}): ${body}`)
  }
}
