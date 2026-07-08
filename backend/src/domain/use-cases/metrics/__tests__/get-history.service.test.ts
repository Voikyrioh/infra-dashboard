import { expect } from 'chai'
import Config from '@config'
import { parsePromResponse, fetchHistory } from '../get-history/get-history.service'

describe('get-history service', () => {
	describe('parsePromResponse', () => {
		it('transforme les valeurs en DataPoints {t, v}', () => {
			const promResponse = {
				status: 'success',
				data: {
					resultType: 'matrix',
					result: [{ metric: {}, values: [[1714220000, '42.3'], [1714220060, '45.1']] as [number, string][] }],
				},
			}
			const points = parsePromResponse(promResponse)
			expect(points).to.deep.equal([
				{ t: 1714220000, v: 42.3 },
				{ t: 1714220060, v: 45.1 },
			])
		})

		it('retourne [] si result est vide', () => {
			const promResponse = { status: 'success', data: { resultType: 'matrix', result: [] } }
			expect(parsePromResponse(promResponse)).to.deep.equal([])
		})
	})

	describe('fetchHistory', () => {
		let originalUrl: string | null
		let originalKey: string | null

		beforeEach(() => {
			originalUrl = Config.Server.SignozApiUrl
			originalKey = Config.Server.SignozApiKey
		})

		afterEach(() => {
			Config.Server.SignozApiUrl = originalUrl
			Config.Server.SignozApiKey = originalKey
		})

		it('returns empty when SignozApiUrl is not configured', async () => {
			Config.Server.SignozApiUrl = null
			const result = await fetchHistory('1h')
			expect(result).to.deep.equal({ cpu: [], ram: [] })
		})

		it('returns empty when SignozApiKey is not configured', async () => {
			Config.Server.SignozApiUrl = 'http://signoz:8080'
			Config.Server.SignozApiKey = null
			const result = await fetchHistory('1h')
			expect(result).to.deep.equal({ cpu: [], ram: [] })
		})
	})
})
