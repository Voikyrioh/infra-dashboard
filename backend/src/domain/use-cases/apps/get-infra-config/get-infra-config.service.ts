import yaml from 'js-yaml'
import Config from '@config'

export interface InfraEnvConfig {
  env: Record<string, string>
  logFile: string | null
}

interface GitHubContentsFile {
  content: string
  encoding: string
  sha: string
}

export async function fetchInfraConfig(appName: string): Promise<InfraEnvConfig> {
  const token = Config.Server.GitHubToken
  const owner = Config.Server.GitHubOwner
  const infraRepo = Config.Server.GitHubInfraRepo
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }

  const res = await fetch(
    `https://api.github.com/repos/${owner}/${infraRepo}/contents/apps/${appName}.yml`,
    { headers },
  )
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`)

  const file = (await res.json()) as GitHubContentsFile
  if (!file.content || file.encoding !== 'base64') throw new Error('Invalid file encoding')

  const decoded = Buffer.from(file.content.replace(/\n/g, ''), 'base64').toString('utf-8')
  const config = yaml.load(decoded) as Record<string, unknown>

  const rawEnv = (config.env ?? {}) as Record<string, unknown>
  const env: Record<string, string> = {}
  for (const [k, v] of Object.entries(rawEnv)) {
    env[k] = String(v)
  }

  return {
    env,
    logFile: typeof env.LOG_FILE === 'string' ? env.LOG_FILE : null,
  }
}

export async function commitInfraConfig(
  appName: string,
  env: Record<string, string>,
): Promise<void> {
  const token = Config.Server.GitHubToken
  const owner = Config.Server.GitHubOwner
  const infraRepo = Config.Server.GitHubInfraRepo
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  }

  const getRes = await fetch(
    `https://api.github.com/repos/${owner}/${infraRepo}/contents/apps/${appName}.yml`,
    { headers },
  )
  if (!getRes.ok) throw new Error(`GitHub API error: ${getRes.status}`)

  const file = (await getRes.json()) as { content: string; sha: string }
  const decoded = Buffer.from(file.content.replace(/\n/g, ''), 'base64').toString('utf-8')
  const config = yaml.load(decoded) as Record<string, unknown>

  config.env = env

  const updated = yaml.dump(config, { lineWidth: -1 })
  const encoded = Buffer.from(updated).toString('base64')

  const putRes = await fetch(
    `https://api.github.com/repos/${owner}/${infraRepo}/contents/apps/${appName}.yml`,
    {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        message: `chore(${appName}): update env vars via dashboard`,
        content: encoded,
        sha: file.sha,
      }),
    },
  )
  if (!putRes.ok) throw new Error(`GitHub commit failed: ${putRes.status}`)
}
