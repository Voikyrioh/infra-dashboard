import http from 'node:http'

interface DockerContainerStats {
	cpu_stats: {
		cpu_usage: { total_usage: number }
		system_cpu_usage: number
		online_cpus?: number
	}
	precpu_stats: {
		cpu_usage: { total_usage: number }
		system_cpu_usage: number
	}
	memory_stats: {
		usage: number
		limit: number
		stats?: { inactive_file?: number; cache?: number }
	}
}

interface DockerInfo {
	MemTotal: number
}

export interface LiveMetrics {
	cpu: number
	ram: { used: number; total: number }
}

function dockerGet<T>(socketPath: string, path: string): Promise<T> {
	return new Promise((resolve, reject) => {
		const req = http.get(
			{ socketPath, path },
			(res) => {
				const chunks: Buffer[] = []
				res.on('data', (chunk) => chunks.push(chunk))
				res.on('end', () => {
					try {
						resolve(JSON.parse(Buffer.concat(chunks).toString()))
					} catch (e) {
						reject(e)
					}
				})
			},
		)
		req.on('error', reject)
	})
}

export function calcCpuPercent(stats: DockerContainerStats): number {
	const cpuDelta =
		stats.cpu_stats.cpu_usage.total_usage -
		stats.precpu_stats.cpu_usage.total_usage
	const systemDelta =
		stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage
	const numCpus = stats.cpu_stats.online_cpus ?? 1
	if (systemDelta <= 0 || cpuDelta < 0) return 0
	return (cpuDelta / systemDelta) * numCpus * 100
}

export function calcRamMb(stats: DockerContainerStats): number {
	const cache =
		stats.memory_stats.stats?.inactive_file ??
		stats.memory_stats.stats?.cache ??
		0
	return Math.round((stats.memory_stats.usage - cache) / 1024 / 1024)
}

export async function fetchLiveMetrics(): Promise<LiveMetrics> {
	const { default: Config } = await import('@config')
	const socketPath = Config.Server.DockerSocket

	const [info, containers] = await Promise.all([
		dockerGet<DockerInfo>(socketPath, '/info'),
		dockerGet<{ Id: string }[]>(socketPath, '/containers/json'),
	])

	const statsArray = await Promise.all(
		containers.map((c) =>
			dockerGet<DockerContainerStats>(socketPath, `/containers/${c.Id}/stats?stream=false`),
		),
	)

	const totalRamMb = Math.round(info.MemTotal / 1024 / 1024)
	const usedRamMb = statsArray.reduce((sum, s) => sum + calcRamMb(s), 0)
	const totalCpu = statsArray.reduce((sum, s) => sum + calcCpuPercent(s), 0)
	const cpuPercent = Math.min(Math.round(totalCpu * 10) / 10, 100)

	return { cpu: cpuPercent, ram: { used: usedRamMb, total: totalRamMb } }
}
