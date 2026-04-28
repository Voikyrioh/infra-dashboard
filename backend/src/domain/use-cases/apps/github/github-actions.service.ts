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
