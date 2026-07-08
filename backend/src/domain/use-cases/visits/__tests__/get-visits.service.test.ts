import { expect } from 'chai'
import { fetchGlobalVisits, fetchTopApps } from '../get-visits/get-visits.service'
import Config from '@config'

describe('get-visits service', () => {
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

		it('fetchTopApps retourne [] si CF non configuré', async () => {
			const savedToken = Config.Server.CfApiToken
			const savedZone = Config.Server.CfZoneId
			;(Config.Server as any).CfApiToken = null
			;(Config.Server as any).CfZoneId = null
			const result = await fetchTopApps()
			;(Config.Server as any).CfApiToken = savedToken
			;(Config.Server as any).CfZoneId = savedZone
			expect(result).to.deep.equal([])
		})
	})
})
