import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import VersionSelect from './VersionSelect.vue'

const versions = ['v0.2.0', 'v0.1.1', 'v0.1.0', 'v0.0.1']

describe('VersionSelect', () => {
  it('affiche la version déployée pré-sélectionnée dans l\'input', () => {
    const wrapper = mount(VersionSelect, {
      props: { versions, deployedVersion: 'v0.1.1', disabled: false },
    })
    expect(wrapper.find('input').element.value).toBe('v0.1.1')
  })

  it('affiche "Déployée" et désactive le bouton quand la sélection === version déployée', () => {
    const wrapper = mount(VersionSelect, {
      props: { versions, deployedVersion: 'v0.1.1', disabled: false },
    })
    expect(wrapper.find('button').text()).toContain('Déployée')
    expect(wrapper.find('button').attributes('disabled')).toBeDefined()
  })

  it('affiche "Déployer" quand la sélection est plus récente que la déployée', async () => {
    const wrapper = mount(VersionSelect, {
      props: { versions, deployedVersion: 'v0.1.1', disabled: false },
    })
    await wrapper.find('input').setValue('v0.2.0')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('button').text()).toContain('Déployer')
  })

  it('affiche "Rollback" quand la sélection !== version déployée', async () => {
    const wrapper = mount(VersionSelect, {
      props: { versions, deployedVersion: 'v0.2.0', disabled: false },
    })
    // v0.2.0 est pré-sélectionné car c'est deployedVersion, mais on simule une sélection différente
    // On force selected à une autre valeur via l'input
    const input = wrapper.find('input')
    await input.setValue('v0.1.1')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('button').text()).toContain('Rollback')
  })

  it('émet deploy avec la version sélectionnée au clic sur le bouton', async () => {
    const wrapper = mount(VersionSelect, {
      props: { versions, deployedVersion: 'v0.1.1', disabled: false },
    })
    await wrapper.find('input').setValue('v0.2.0')
    await wrapper.vm.$nextTick()
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('deploy')).toBeTruthy()
    expect(wrapper.emitted('deploy')![0]).toEqual(['v0.2.0'])
  })

  it('filtre les versions quand on tape dans l\'input', async () => {
    const wrapper = mount(VersionSelect, {
      props: { versions, deployedVersion: 'v0.1.1', disabled: false },
    })
    await wrapper.find('input').setValue('v0.2')
    await wrapper.vm.$nextTick()
    const items = wrapper.findAll('[data-testid="version-option"]')
    expect(items).toHaveLength(1)
    expect(items[0]!.text()).toContain('v0.2.0')
  })

  it('est désactivé quand disabled=true', () => {
    const wrapper = mount(VersionSelect, {
      props: { versions: [], deployedVersion: null, disabled: true },
    })
    expect(wrapper.find('input').attributes('disabled')).toBeDefined()
    expect(wrapper.find('button').attributes('disabled')).toBeDefined()
  })
})
