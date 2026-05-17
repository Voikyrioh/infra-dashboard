import yaml from 'js-yaml'
import Config from '@config'
import { AppError } from '@errors/app.error'

interface InfraAppConfig {
  name: string
  github_repo: string
  image: string
}

interface GitHubContentsItem {
  name: string
  type: string
}

interface GitHubContentsFile {
  name: string
  type: string
  content: string
  encoding: string
}

export interface AppInfo {
  appName: string
  repoName: string
  repoUrl: string
  imageName: string
}

export async function searchAppsOnGitHub(): Promise<AppInfo[]> {
  const token = Config.Server.GitHubToken
  if (!token) throw new AppError('internal-server-error', 'GITHUB_TOKEN not configured')

  const owner = Config.Server.GitHubOwner
  const infraRepo = Config.Server.GitHubInfraRepo
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }

  const listRes = await fetch(
    `https://api.github.com/repos/${owner}/${infraRepo}/contents/apps`,
    { headers },
  )
  if (!listRes.ok) {
    throw new AppError('internal-server-error', `Failed to list infra apps (${listRes.status})`)
  }

  const items = (await listRes.json()) as GitHubContentsItem[]
  const ymlFiles = items.filter((f) => f.type === 'file' && f.name.endsWith('.yml'))

  const results: AppInfo[] = []

  for (const file of ymlFiles) {
    const fileRes = await fetch(
      `https://api.github.com/repos/${owner}/${infraRepo}/contents/apps/${file.name}`,
      { headers },
    )
    if (!fileRes.ok) continue

    const fileData = (await fileRes.json()) as GitHubContentsFile
    if (!fileData.content || fileData.encoding !== 'base64') continue

    const decoded = Buffer.from(fileData.content.replace(/\n/g, ''), 'base64').toString('utf-8')

    let config: unknown
    try {
      config = yaml.load(decoded)
    } catch {
      continue
    }

    const c = config as Partial<InfraAppConfig>
    if (!c?.name || !c?.github_repo || !c?.image) continue

    const EXCLUDED_APP_NAMES = ['example']
    if (EXCLUDED_APP_NAMES.includes(c.name)) continue
    if (c.name === Config.Server.GitHubRepo) continue

    const repoName = c.github_repo.split('/').pop()!
    const imageName = c.image.split('/').pop()!

    results.push({
      appName: c.name,
      repoName,
      repoUrl: `https://github.com/${c.github_repo}`,
      imageName,
    })
  }

  return results
}
