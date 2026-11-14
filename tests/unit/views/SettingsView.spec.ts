import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'
import type { User } from '@supabase/supabase-js'
import SettingsView from '@/views/SettingsView.vue'
import { useHabitStore } from '@/stores/habitStore'
import { useAuthStore } from '@/stores/authStore'
import { InMemoryStorageService } from '@/services/storage/InMemoryStorageService'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: { template: '<div />' } },
    { path: '/settings', component: { template: '<div />' } },
    { path: '/signup', component: { template: '<div />' } },
    { path: '/login', component: { template: '<div />' } },
    { path: '/today', component: { template: '<div />' } }
  ]
})

function mountSettings() {
  const div = document.createElement('div')
  document.body.appendChild(div)
  return mount(SettingsView, {
    attachTo: div,
    global: { plugins: [router] }
  })
}

describe('SettingsView.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders the Settings heading and account section in guest mode', () => {
    const wrapper = mountSettings()
    expect(wrapper.text()).toContain('Settings')
    expect(wrapper.text()).toContain('Account & Cloud Sync')
    expect(wrapper.text()).toContain('Using local data only')
    expect(wrapper.text()).toContain('Create free account')
    expect(wrapper.text()).toContain('Sign in')
    wrapper.unmount()
  })

  it('renders authenticated account details and log out button', async () => {
    const authStore = useAuthStore()
    authStore.user = { id: 'u-1', email: 'user@example.com' } as unknown as User
    const signOutSpy = vi.spyOn(authStore, 'signOut').mockResolvedValueOnce({ success: true })

    const wrapper = mountSettings()
    expect(wrapper.text()).toContain('Cloud Sync Enabled')
    expect(wrapper.text()).toContain('user@example.com')

    const logoutBtn = wrapper.findAll('button').find((b) => b.text().includes('Log out'))
    expect(logoutBtn).toBeDefined()
    await logoutBtn?.trigger('click')

    expect(signOutSpy).toHaveBeenCalled()
    wrapper.unmount()
  })

  it('shows "Load demo data" button when no demo data is loaded', () => {
    const wrapper = mountSettings()
    const buttons = wrapper.findAll('button')
    const loadBtn = buttons.find((b) => b.text().includes('Load demo data'))
    expect(loadBtn).toBeDefined()
    wrapper.unmount()
  })

  it('"Load demo data" button is disabled when demo data is already present', async () => {
    const store = useHabitStore()
    store.loadDemoData(new InMemoryStorageService())

    const wrapper = mountSettings()
    await wrapper.vm.$nextTick()

    const loadBtn = wrapper.findAll('button').find((b) => b.text().includes('Load demo data'))
    expect(loadBtn?.element.hasAttribute('disabled')).toBe(true)
    wrapper.unmount()
  })

  it('shows confirmation dialog in document.body when "Load demo data" is clicked', async () => {
    const wrapper = mountSettings()
    const loadBtn = wrapper.findAll('button').find((b) => b.text().includes('Load demo data'))
    await loadBtn?.trigger('click')
    await wrapper.vm.$nextTick()

    expect(document.body.textContent).toContain('Load demo data?')
    expect(document.body.textContent).toContain('Cancel')
    wrapper.unmount()
  })

  it('closes the dialog without loading when Cancel is clicked', async () => {
    const store = useHabitStore()
    const wrapper = mountSettings()

    await wrapper
      .findAll('button')
      .find((b) => b.text().includes('Load demo data'))
      ?.trigger('click')
    await wrapper.vm.$nextTick()

    const cancelBtn = Array.from(document.body.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Cancel'
    )
    cancelBtn?.click()
    await wrapper.vm.$nextTick()

    expect(store.habits.filter((h) => h.isDemo)).toHaveLength(0)
    expect(document.body.textContent).not.toContain('Load demo data?')
    wrapper.unmount()
  })

  it('loads demo data when Load is confirmed', async () => {
    const store = useHabitStore()
    const wrapper = mountSettings()

    await wrapper
      .findAll('button')
      .find((b) => b.text().includes('Load demo data'))
      ?.trigger('click')
    await wrapper.vm.$nextTick()

    const loadConfirm = Array.from(document.body.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Load'
    )
    loadConfirm?.click()
    await wrapper.vm.$nextTick()

    expect(store.habits.filter((h) => h.isDemo)).toHaveLength(5)
    wrapper.unmount()
  })

  it('shows "Remove demo data" button when demo data is loaded', async () => {
    const store = useHabitStore()
    store.loadDemoData(new InMemoryStorageService())

    const wrapper = mountSettings()
    await wrapper.vm.$nextTick()

    const removeBtn = wrapper.findAll('button').find((b) => b.text().includes('Remove demo data'))
    expect(removeBtn).toBeDefined()
    wrapper.unmount()
  })

  it('removes demo data when Remove is confirmed', async () => {
    const store = useHabitStore()
    store.loadDemoData(new InMemoryStorageService())

    const wrapper = mountSettings()
    await wrapper.vm.$nextTick()

    await wrapper
      .findAll('button')
      .find((b) => b.text().includes('Remove demo data'))
      ?.trigger('click')
    await wrapper.vm.$nextTick()

    const removeConfirm = Array.from(document.body.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Remove'
    )
    removeConfirm?.click()
    await wrapper.vm.$nextTick()

    expect(store.habits.filter((h) => h.isDemo)).toHaveLength(0)
    wrapper.unmount()
  })
})
