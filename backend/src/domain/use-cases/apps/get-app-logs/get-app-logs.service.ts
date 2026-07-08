import http from 'node:http'
import Config from '@config'

export interface LogLine {
  timestamp: string
  message: string
  source: 'file'
}

// Le stream /containers/:id/logs est multiplexé (frames [type,0,0,0,size u32BE])
// sauf si le conteneur tourne en TTY (texte brut). timestamps=true préfixe
// chaque ligne d'un RFC3339 nano.
export function parseDockerLogs(raw: Buffer): LogLine[] {
  let text = ''
  const isMultiplexed =
    raw.length >= 8 && raw[0]! <= 2 && raw[1] === 0 && raw[2] === 0 && raw[3] === 0
  if (isMultiplexed) {
    let offset = 0
    while (offset + 8 <= raw.length) {
      const size = raw.readUInt32BE(offset + 4)
      text += raw.subarray(offset + 8, offset + 8 + size).toString('utf-8')
      offset += 8 + size
    }
  } else {
    text = raw.toString('utf-8')
  }

  return text
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const spaceIdx = line.indexOf(' ')
      const ts = spaceIdx > 0 ? Date.parse(line.slice(0, spaceIdx)) : Number.NaN
      const hasTimestamp = !Number.isNaN(ts)
      return {
        timestamp: hasTimestamp ? new Date(ts).toISOString() : new Date().toISOString(),
        message: hasTimestamp ? line.slice(spaceIdx + 1) : line,
        source: 'file' as const,
      }
    })
}

// Sortie stdout/stderr du conteneur via l'API Docker (équivalent `docker logs`).
// Remplace l'ancien `tail` du LOG_FILE : toutes les apps loggent vers /dev/stdout.
export async function fetchContainerLogs(containerName: string, limit = 200): Promise<LogLine[]> {
  const socketPath = Config.Server.DockerSocket

  return new Promise((resolve) => {
    const req = http.request(
      {
        socketPath,
        path: `/containers/${containerName}/logs?stdout=true&stderr=true&timestamps=true&tail=${limit}`,
        method: 'GET',
      },
      (res: any) => {
        const chunks: Buffer[] = []
        res.on('data', (c: Buffer) => chunks.push(c))
        res.on('end', () => {
          if (res.statusCode !== 200) return resolve([])
          try {
            resolve(parseDockerLogs(Buffer.concat(chunks)))
          } catch {
            resolve([])
          }
        })
      },
    )
    req.on('error', () => resolve([]))
    req.end()
  })
}
