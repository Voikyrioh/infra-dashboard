import http from 'node:http'
import Config from '@config'

export interface LogLine {
  timestamp: string
  message: string
  source: 'loki' | 'file'
}

interface LokiQueryResponse {
  status: string
  data: {
    resultType: string
    result: Array<{
      stream: Record<string, string>
      values: [string, string][]
    }>
  }
}

export async function fetchLokiLogs(containerName: string, limit = 200): Promise<LogLine[]> {
  const lokiUrl = Config.Server.LokiUrl
  if (!lokiUrl) return []

  try {
    const query = encodeURIComponent(`{job="docker"} |= \`${containerName}\``)
    const res = await fetch(
      `${lokiUrl}/loki/api/v1/query_range?query=${query}&limit=${limit}&direction=backward`,
    )
    if (!res.ok) return []

    const data: LokiQueryResponse = await res.json()
    const lines: LogLine[] = []

    for (const stream of data.data.result) {
      for (const [ns, msg] of stream.values) {
        const ms = Math.floor(Number(ns) / 1_000_000)
        lines.push({
          timestamp: new Date(ms).toISOString(),
          message: msg,
          source: 'loki',
        })
      }
    }

    return lines.sort((a, b) => a.timestamp.localeCompare(b.timestamp))
  } catch {
    return []
  }
}

export async function fetchDockerFileLogs(
  containerName: string,
  logFile: string,
  limit = 200,
): Promise<LogLine[]> {
  const socketPath = Config.Server.DockerSocket

  return new Promise((resolve) => {
    const execBody = JSON.stringify({
      AttachStdout: true,
      AttachStderr: true,
      Cmd: ['tail', '-n', String(limit), logFile],
    })

    const createReq = http.request(
      {
        socketPath,
        path: `/containers/${containerName}/exec`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': execBody.length },
      },
      (res: any) => {
        const chunks: Buffer[] = []
        res.on('data', (c: Buffer) => chunks.push(c))
        res.on('end', () => {
          try {
            const { Id } = JSON.parse(Buffer.concat(chunks).toString())
            const startBody = JSON.stringify({ Detach: false, Tty: false })
            const startReq = http.request(
              {
                socketPath,
                path: `/exec/${Id}/start`,
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Content-Length': startBody.length },
              },
              (sRes: any) => {
                const sChunks: Buffer[] = []
                sRes.on('data', (c: Buffer) => sChunks.push(c))
                sRes.on('end', () => {
                  const raw = Buffer.concat(sChunks).toString('utf-8')
                  const lines = raw
                    .split('\n')
                    .filter(Boolean)
                    .map((line) => ({
                      timestamp: new Date().toISOString(),
                      message: line,
                      source: 'file' as const,
                    }))
                  resolve(lines)
                })
              },
            )
            startReq.on('error', () => resolve([]))
            startReq.write(startBody)
            startReq.end()
          } catch {
            resolve([])
          }
        })
      },
    )
    createReq.on('error', () => resolve([]))
    createReq.write(execBody)
    createReq.end()
  })
}
