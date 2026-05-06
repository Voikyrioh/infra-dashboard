import http from 'node:http'
import Config from '@config'

export type ContainerStatus = 'running' | 'stopped' | 'unknown'

export interface ContainerResult {
  status: ContainerStatus
  version: string | null
}

interface DockerContainerInfo {
  State: { Running: boolean }
  Config: { Image: string }
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

export async function getContainerStatus(containerName: string): Promise<ContainerResult> {
  try {
    const info = await dockerGet<DockerContainerInfo>(
      Config.Server.DockerSocket,
      `/containers/${containerName}/json`,
    )
    const image = info.Config?.Image ?? ''
    const tag = image.includes(':') ? image.split(':').pop() ?? null : null
    const version = tag && /^v\d+\.\d+\.\d+$/.test(tag) ? tag : null
    return {
      status: info.State.Running ? 'running' : 'stopped',
      version,
    }
  } catch {
    return { status: 'unknown', version: null }
  }
}
