import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import type { User } from '@supabase/supabase-js'
import AppNavbar from '@/components/layout/AppNavbar.vue'
import { useAuthStore } from '@/stores/authStore'
import { useHabitStore } from '@/stores/habitStore'

describe('AppNavbar.vue', () => {
  let router: ReturnType<typeof createRouter>

  beforeEach(async () => {
    setActivePinia(createPinia())
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/today', component: { template: '<div>Today</div>' } },
        { path: '/weekly', component: { template: '<div>Weekly</div>' } },
        { path: '/stats', component: { template: '<div>Stats</div>' } },
        { path: '/habits', component: { template: '<div>Habits</div>' } },
        { path: '/settings', component: { template: '<div>Settings</div>' } },
        { path: '/login', component: { template: '<div>Login</div>' } }
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
    expect(wrapper.text()).toContain('Stats')
    expect(wrapper.text()).toContain('Manage Habits')
    expect(wrapper.text()).toContain('Settings')
  })

  it('renders "Sign in" button in guest mode', () => {
    const authStore = useAuthStore()
    authStore.user = null

    const wrapper = mount(AppNavbar, {
      global: {
        plugins: [router],
        stubs: { ThemeToggle: true }
      }
    })

    expect(wrapper.text()).toContain('Sign in')
    expect(wrapper.text()).not.toContain('Log out')
  })

  it('renders user email and "Log out" button when authenticated', async () => {
    const authStore = useAuthStore()
    authStore.user = { id: 'u-1', email: 'alice@example.com' } as unknown as User
    const signOutSpy = vi.spyOn(authStore, 'signOut').mockResolvedValueOnce({ success: true })

    const wrapper = mount(AppNavbar, {
      global: {
        plugins: [router],
        stubs: { ThemeToggle: true }
      }
    })

    expect(wrapper.text()).toContain('alice@example.com')
    const logoutBtn = wrapper.findAll('button').find((b) => b.text().includes('Log out'))
    expect(logoutBtn).toBeDefined()

    await logoutBtn?.trigger('click')
    expect(signOutSpy).toHaveBeenCalled()
  })

  it('renders sync status when authenticated', async () => {
    const authStore = useAuthStore()
    authStore.user = { id: 'u-1', email: 'alice@example.com' } as unknown as User
    const habitStore = useHabitStore()
    habitStore.syncStatus = 'syncing'

    const wrapper = mount(AppNavbar, {
      global: {
        plugins: [router],
        stubs: { ThemeToggle: true }
      }
    })

    expect(wrapper.text()).toContain('Syncing...')

    habitStore.syncStatus = 'error'
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Sync error (Retry)')

    habitStore.syncStatus = 'synced'
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Synced')
  })
})
