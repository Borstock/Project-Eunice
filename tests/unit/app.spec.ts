import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import App from '@/App.vue'

describe('App root component', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders navbar, footer and router-view', () => {
    const wrapper = mount(App, {
      global: {
        stubs: ['RouterView', 'AppNavbar', 'AppFooter']
      }
    })
    expect(wrapper.exists()).toBe(true)
  })
})
