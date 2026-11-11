import { defineStore } from 'pinia'
import type { IStorageService } from '@/services/storage/IStorageService'
import { localStorageService } from '@/services/storage/LocalStorageService'

export type ThemeMode = 'light' | 'dark' | 'system'

const THEME_STORAGE_KEY = 'settings_theme'

export interface SettingsStoreState {
  theme: ThemeMode
}

export const useSettingsStore = defineStore('settings', {
  state: (): SettingsStoreState => ({
    theme: 'system'
  }),

  actions: {
    async initTheme(storage: IStorageService = localStorageService): Promise<void> {
      const savedTheme = await storage.getItem<ThemeMode>(THEME_STORAGE_KEY)
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        this.theme = savedTheme
      }
      this.applyTheme()
    },

    setTheme(newTheme: ThemeMode, storage: IStorageService = localStorageService): void {
      this.theme = newTheme
      storage.setItem(THEME_STORAGE_KEY, newTheme)
      this.applyTheme()
    },

    applyTheme(): void {
      if (typeof window === 'undefined') return

      const root = document.documentElement
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

      if (this.theme === 'dark' || (this.theme === 'system' && prefersDark)) {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }
  }
})
