import { expect } from 'chai'
import Config from '@config'
import { parseVictoriaResponse, fetchHistory } from '../get-history/get-history.service'

describe('get-history service', () => {
	describe('parseVictoriaResponse', () => {
		it('transforme les valeurs en DataPoints {t, v}', () => {
			const vmResponse = {
				status: 'success',
				data: {
					resultType: 'matrix',
					result: [{ metric: {}, values: [[1714220000, '42.3'], [1714220060, '45.1']] as [number, string][] }],
				},
			}
			const points = parseVictoriaResponse(vmResponse)
			expect(points).to.deep.equal([
				{ t: 1714220000, v: 42.3 },
				{ t: 1714220060, v: 45.1 },
			])
		})

		it('retourne [] si result est vide', () => {
			const vmResponse = { status: 'success', data: { resultType: 'matrix', result: [] } }
			expect(parseVictoriaResponse(vmResponse)).to.deep.equal([])
		})
	})

	describe('fetchHistory', () => {
		let originalUrl: string | null

		beforeEach(() => {
			originalUrl = Config.Server.VictoriaMetricsUrl
		})

		afterEach(() => {
			Config.Server.VictoriaMetricsUrl = originalUrl
		})

		it('returns empty when VictoriaMetricsUrl is not configured', async () => {
			Config.Server.VictoriaMetricsUrl = null
			const result = await fetchHistory('1h')
			expect(result).to.deep.equal({ cpu: [], ram: [] })
		})
	})
})
