import http from 'node:http'
import Config from '@config'

export interface ContainerStats {
  cpuPercent: number
  memUsageMb: number
  memLimitMb: number
  memPercent: number
}

interface DockerStatsResponse {
  cpu_stats: {
    cpu_usage: { total_usage: number }
    system_cpu_usage: number
    online_cpus: number
  }
  precpu_stats: {
    cpu_usage: { total_usage: number }
    system_cpu_usage: number
  }
  memory_stats: {
    usage: number
    limit: number
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

export async function getContainerStats(containerName: string): Promise<ContainerStats | null> {
  try {
    const stats = await dockerGet<DockerStatsResponse>(
      Config.Server.DockerSocket,
      `/containers/${containerName}/stats?stream=false`,
    )

    const cpuDelta =
      stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage
    const systemDelta =
      stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage
    const numCpus = stats.cpu_stats.online_cpus || 1
    const cpuPercent =
      systemDelta > 0 ? (cpuDelta / systemDelta) * numCpus * 100 : 0

    const memUsageMb = stats.memory_stats.usage / 1048576
    const memLimitMb = stats.memory_stats.limit / 1048576
    const memPercent = memLimitMb > 0 ? (memUsageMb / memLimitMb) * 100 : 0

    return {
      cpuPercent: Math.round(cpuPercent * 10) / 10,
      memUsageMb: Math.round(memUsageMb),
      memLimitMb: Math.round(memLimitMb),
      memPercent: Math.round(memPercent * 10) / 10,
    }
  } catch {
    return null
  }
}
