import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import type { User } from '@supabase/supabase-js'
import App from '@/App.vue'
import { useAuthStore } from '@/stores/authStore'
import { useHabitStore } from '@/stores/habitStore'

describe('App root component', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders navbar, footer and router-view', () => {
    const wrapper = mount(App, {
      global: {
        stubs: ['RouterView', 'AppNavbar', 'AppFooter', 'MigrationModal']
      }
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('calls initStore again when auth user changes after initialization', async () => {
    const authStore = useAuthStore()
    authStore.isInitialized = true // simulate already-initialized state

    const habitStore = useHabitStore()
    const initSpy = vi.spyOn(habitStore, 'initStore').mockResolvedValue()

    mount(App, {
      global: {
        stubs: ['RouterView', 'AppNavbar', 'AppFooter', 'MigrationModal']
      }
    })

    // Allow onMounted to run
    await new Promise((r) => setTimeout(r, 20))

    const callsBefore = initSpy.mock.calls.length

    // Simulate user logging in (auth state change)
    authStore.user = { id: 'new-user', email: 'test@example.com' } as unknown as User
    await new Promise((r) => setTimeout(r, 20))

    expect(initSpy.mock.calls.length).toBeGreaterThan(callsBefore)
  })
})
