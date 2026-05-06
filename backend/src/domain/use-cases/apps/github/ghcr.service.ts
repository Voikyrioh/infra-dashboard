import Config from '@config'

interface GHCRVersion {
  id: number
  name: string
  metadata: {
    container: {
      tags: string[]
    }
  }
}

export async function getImageVersions(imageName: string): Promise<string[]> {
  const token = Config.Server.GitHubToken
  if (!token) return []

  const owner = Config.Server.GitHubOwner.toLowerCase()
  const res = await fetch(
    `https://api.github.com/users/${owner}/packages/container/${imageName}/versions?per_page=100`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    },
  )
  if (!res.ok) return []

  const versions = (await res.json()) as GHCRVersion[]
  const semverTags = versions
    .flatMap((v) => v.metadata.container.tags)
    .filter((tag) => /^v\d+\.\d+\.\d+$/.test(tag))

  const unique = [...new Set(semverTags)]

  return unique.sort((a, b) => {
    const parse = (v: string) => v.slice(1).split('.').map(Number) as [number, number, number]
    const [ma, mi, pa] = parse(a)
    const [mb, mib, pb] = parse(b)
    return mb - ma || mib - mi || pb - pa
  })
}
