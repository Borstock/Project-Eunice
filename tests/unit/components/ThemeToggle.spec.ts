import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import ThemeToggle from '@/components/layout/ThemeToggle.vue'
import { useSettingsStore } from '@/stores/settingsStore'

describe('ThemeToggle.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders button and cycles theme when clicked', async () => {
    const settingsStore = useSettingsStore()
    settingsStore.theme = 'light'

    const wrapper = mount(ThemeToggle)
    const button = wrapper.find('button')
    expect(button.exists()).toBe(true)

    await button.trigger('click')
    expect(settingsStore.theme).toBe('dark')

    await button.trigger('click')
    expect(settingsStore.theme).toBe('light')
  })
})
