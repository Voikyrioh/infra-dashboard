import { expect } from 'chai'
import {
	fetchGlobalVisits,
	fetchTopApps,
	parseLokiTopApps,
} from '../get-visits/get-visits.service'
import Config from '@config'

describe('get-visits service', () => {
	describe('parseLokiTopApps', () => {
		it('transforme la réponse Loki en liste {name, visits}', () => {
			const lokiResponse = {
				status: 'success',
				data: {
					resultType: 'vector',
					result: [
						{ metric: { app: 'portfolio' }, value: [1714220000, '540'] },
						{ metric: { app: 'api' }, value: [1714220000, '310'] },
					],
				},
			} as any
			const result = parseLokiTopApps(lokiResponse)
			expect(result).to.deep.equal([
				{ name: 'portfolio', visits: 540 },
				{ name: 'api', visits: 310 },
			])
		})

		it('retourne [] si result est vide', () => {
			const empty = {
				status: 'success',
				data: { resultType: 'vector', result: [] },
			} as any
			expect(parseLokiTopApps(empty)).to.deep.equal([])
		})
	})

	describe('null config guards', () => {
		it('fetchGlobalVisits retourne null si CF non configuré', async () => {
			const savedToken = Config.Server.CfApiToken
			const savedZone = Config.Server.CfZoneId
			;(Config.Server as any).CfApiToken = null
			;(Config.Server as any).CfZoneId = null
			const result = await fetchGlobalVisits()
			;(Config.Server as any).CfApiToken = savedToken
			;(Config.Server as any).CfZoneId = savedZone
			expect(result).to.equal(null)
		})

		it('fetchTopApps retourne [] si Loki non configuré', async () => {
			const savedLoki = Config.Server.LokiUrl
			;(Config.Server as any).LokiUrl = null
			const result = await fetchTopApps()
			;(Config.Server as any).LokiUrl = savedLoki
			expect(result).to.deep.equal([])
		})
	})
})
