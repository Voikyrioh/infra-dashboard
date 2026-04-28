import { expect } from 'chai'
import { assertAndCoerceAppModelToEntity } from '../app.dao'

describe('app.dao', () => {
  it('transforme un AppModel en AppEntity', () => {
    const model = {
      id: '018f5e3e-0000-7000-8000-000000000001',
      repo_name: 'my-app',
      repo_url: 'https://github.com/voikyrioh/my-app',
      display_name: 'My App',
      type: 'backend',
      container_name: 'my-app',
      configured: true,
      last_synced_at: new Date('2026-01-01'),
      created_at: new Date('2026-01-01'),
      updated_at: new Date('2026-01-01'),
    }
    const entity = assertAndCoerceAppModelToEntity(model)
    expect(entity.repoName).to.equal('my-app')
    expect(entity.type).to.equal('backend')
    expect(entity.tags).to.deep.equal([])
  })

  it('accepte display_name null', () => {
    const model = {
      id: '018f5e3e-0000-7000-8000-000000000001',
      repo_name: 'my-app',
      repo_url: 'https://github.com/voikyrioh/my-app',
      display_name: null,
      type: null,
      container_name: null,
      configured: false,
      last_synced_at: null,
      created_at: new Date('2026-01-01'),
      updated_at: new Date('2026-01-01'),
    }
    const entity = assertAndCoerceAppModelToEntity(model)
    expect(entity.displayName).to.be.null
    expect(entity.configured).to.be.false
  })
})
