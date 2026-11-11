import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSettingsStore } from '@/stores/settingsStore'
import { InMemoryStorageService } from '@/services/storage/InMemoryStorageService'

describe('useSettingsStore', () => {
  let storage: InMemoryStorageService

  beforeEach(() => {
    setActivePinia(createPinia())
    storage = new InMemoryStorageService()
    document.documentElement.classList.remove('dark')
  })

  it('initializes with default system theme', () => {
    const store = useSettingsStore()
    expect(store.theme).toBe('system')
  })

  it('updates theme to dark and applies dark class', () => {
    const store = useSettingsStore()
    store.setTheme('dark', storage)

    expect(store.theme).toBe('dark')
    expect(storage.getItem('settings_theme')).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('updates theme to light and removes dark class', () => {
    const store = useSettingsStore()
    store.setTheme('dark', storage)
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    store.setTheme('light', storage)
    expect(store.theme).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('loads saved theme preference from storage on initTheme', async () => {
    storage.setItem('settings_theme', 'dark')

    const store = useSettingsStore()
    await store.initTheme(storage)

    expect(store.theme).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })
})
