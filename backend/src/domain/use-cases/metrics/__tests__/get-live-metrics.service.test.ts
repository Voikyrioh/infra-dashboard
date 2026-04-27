import { expect } from 'chai'
import { calcCpuPercent, calcRamMb } from '../get-live-metrics/get-live-metrics.service'

const makeStats = (cpuDelta: number, systemDelta: number, numCpus: number, usage: number, limit: number, cache = 0) => ({
	cpu_stats: {
		cpu_usage: { total_usage: cpuDelta + 1000 },
		system_cpu_usage: systemDelta + 100000,
		online_cpus: numCpus,
	},
	precpu_stats: {
		cpu_usage: { total_usage: 1000 },
		system_cpu_usage: 100000,
	},
	memory_stats: {
		usage,
		limit,
		stats: { inactive_file: cache },
	},
})

describe('get-live-metrics service', () => {
	describe('calcCpuPercent', () => {
		it('calcule le pourcentage CPU correctement', () => {
			// 1/4 du système avec 4 CPUs = 100%
			const stats = makeStats(1000, 4000, 4, 0, 0)
			const result = calcCpuPercent(stats as any)
			expect(result).to.be.closeTo(100, 0.1)
		})

		it('retourne 0 si systemDelta est 0', () => {
			const stats = makeStats(1000, 0, 4, 0, 0)
			const result = calcCpuPercent(stats as any)
			expect(result).to.equal(0)
		})

		it('retourne 0 si cpuDelta est négatif', () => {
			const base = {
				cpu_stats: { cpu_usage: { total_usage: 500 }, system_cpu_usage: 200000, online_cpus: 4 },
				precpu_stats: { cpu_usage: { total_usage: 1000 }, system_cpu_usage: 100000 },
				memory_stats: { usage: 0, limit: 0 },
			}
			expect(calcCpuPercent(base as any)).to.equal(0)
		})
	})

	describe('calcRamMb', () => {
		it('soustrait le cache de la RAM utilisée', () => {
			const stats = makeStats(0, 1, 1, 400 * 1024 * 1024, 8 * 1024 * 1024 * 1024, 100 * 1024 * 1024)
			expect(calcRamMb(stats as any)).to.equal(300)
		})

		it('utilise usage brut si pas de cache', () => {
			const stats = { memory_stats: { usage: 512 * 1024 * 1024, limit: 8 * 1024 * 1024 * 1024 }, cpu_stats: { cpu_usage: { total_usage: 0 }, system_cpu_usage: 0, online_cpus: 1 }, precpu_stats: { cpu_usage: { total_usage: 0 }, system_cpu_usage: 0 } }
			expect(calcRamMb(stats as any)).to.equal(512)
		})
	})
})
