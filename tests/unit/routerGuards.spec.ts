import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import type { User } from '@supabase/supabase-js'
import router from '@/router'
import { useAuthStore } from '@/stores/authStore'

describe('Router Navigation Guards', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    const authStore = useAuthStore()
    authStore.$reset()
    vi.spyOn(authStore, 'initialize').mockResolvedValue()
    await router.push('/')
    await router.isReady()
  })

  it('allows guests to access public routes', async () => {
    const authStore = useAuthStore()
    authStore.user = null
    authStore.isInitialized = true

    await router.push('/today')
    expect(router.currentRoute.value.path).toBe('/today')

    await router.push('/weekly')
    expect(router.currentRoute.value.path).toBe('/weekly')

    await router.push('/stats')
    expect(router.currentRoute.value.path).toBe('/stats')

    await router.push('/habits')
    expect(router.currentRoute.value.path).toBe('/habits')

    await router.push('/settings')
    expect(router.currentRoute.value.path).toBe('/settings')
  })

  it('redirects authenticated users away from guestOnly pages to /today', async () => {
    const authStore = useAuthStore()
    authStore.user = { id: 'u-1', email: 'test@example.com' } as unknown as User
    authStore.isInitialized = true

    await router.push('/login')
    expect(router.currentRoute.value.path).toBe('/today')

    await router.push('/signup')
    expect(router.currentRoute.value.path).toBe('/today')

    await router.push('/forgot-password')
    expect(router.currentRoute.value.path).toBe('/today')
  })

  it('redirects unauthenticated users trying to access requiresAuth route to /login', async () => {
    const authStore = useAuthStore()
    authStore.user = null
    authStore.passwordRecoveryActive = false
    authStore.isInitialized = true

    await router.push('/reset-password')
    expect(router.currentRoute.value.path).toBe('/login')
  })

  it('allows access to reset-password when authenticated or recovery active', async () => {
    const authStore = useAuthStore()
    authStore.user = null
    authStore.passwordRecoveryActive = true
    authStore.isInitialized = true

    await router.push('/reset-password')
    expect(router.currentRoute.value.path).toBe('/reset-password')
  })
})
