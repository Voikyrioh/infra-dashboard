import http from 'node:http'
import Config from '@config'

export type ContainerStatus = 'running' | 'stopped' | 'unknown'

interface DockerContainerInfo {
  State: {
    Running: boolean
  }
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

export async function getContainerStatus(
  containerName: string,
): Promise<ContainerStatus> {
  try {
    const info = await dockerGet<DockerContainerInfo>(
      Config.Server.DockerSocket,
      `/containers/${containerName}/json`,
    )
    return info.State.Running ? 'running' : 'stopped'
  } catch {
    return 'unknown'
  }
}
