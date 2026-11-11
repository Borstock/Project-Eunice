import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import AppNavbar from '@/components/layout/AppNavbar.vue'

describe('AppNavbar.vue', () => {
  let router: ReturnType<typeof createRouter>

  beforeEach(async () => {
    setActivePinia(createPinia())
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/today', component: { template: '<div>Today</div>' } },
        { path: '/weekly', component: { template: '<div>Weekly</div>' } },
        { path: '/habits', component: { template: '<div>Habits</div>' } }
      ]
    })
    await router.push('/today')
    await router.isReady()
  })

  it('renders brand name and navigation items', () => {
    const wrapper = mount(AppNavbar, {
      global: {
        plugins: [router],
        stubs: {
          ThemeToggle: true
        }
      }
    })

    expect(wrapper.text()).toContain('Habit Tracker')
    expect(wrapper.text()).toContain('Today')
    expect(wrapper.text()).toContain('Weekly')
    expect(wrapper.text()).toContain('Manage Habits')
  })
})
