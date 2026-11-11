import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import App from '@/App.vue'

describe('App root component', () => {
  it('renders router-view placeholder without crashing', () => {
    const wrapper = mount(App, {
      global: {
        stubs: ['RouterView']
      }
    })
    expect(wrapper.exists()).toBe(true)
  })
})
