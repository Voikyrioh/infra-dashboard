import { expect } from 'chai'
import { parseLokiTopApps } from '../get-visits/get-visits.service'

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
      const empty = { status: 'success', data: { resultType: 'vector', result: [] } } as any
      expect(parseLokiTopApps(empty)).to.deep.equal([])
    })
  })
})
