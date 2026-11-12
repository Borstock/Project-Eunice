import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('env config', () => {
  // We test the parsing logic directly by re-importing with mocked import.meta.env.
  // Since Vite replaces import.meta.env at build time, in tests we mock the module.

  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('APP_NAME', () => {
    it('returns default when VITE_APP_NAME is not set', async () => {
      vi.stubEnv('VITE_APP_NAME', '')
      const { APP_NAME } = await import('@/config/env')
      expect(APP_NAME).toBe('Habit Tracker')
    })

    it('returns the configured value when set', async () => {
      vi.stubEnv('VITE_APP_NAME', 'My Habits')
      const { APP_NAME } = await import('@/config/env')
      expect(APP_NAME).toBe('My Habits')
    })

    it('trims surrounding whitespace', async () => {
      vi.stubEnv('VITE_APP_NAME', '  My Habits  ')
      const { APP_NAME } = await import('@/config/env')
      expect(APP_NAME).toBe('My Habits')
    })
  })

  describe('STORAGE_PREFIX', () => {
    it('returns default when VITE_STORAGE_PREFIX is not set', async () => {
      vi.stubEnv('VITE_STORAGE_PREFIX', '')
      const { STORAGE_PREFIX } = await import('@/config/env')
      expect(STORAGE_PREFIX).toBe('habit_tracker_')
    })

    it('returns the configured value for a valid prefix', async () => {
      vi.stubEnv('VITE_STORAGE_PREFIX', 'my_app_')
      const { STORAGE_PREFIX } = await import('@/config/env')
      expect(STORAGE_PREFIX).toBe('my_app_')
    })

    it('falls back to default for an invalid prefix with special chars', async () => {
      vi.stubEnv('VITE_STORAGE_PREFIX', 'invalid prefix!')
      const { STORAGE_PREFIX } = await import('@/config/env')
      expect(STORAGE_PREFIX).toBe('habit_tracker_')
    })
  })

  describe('ENABLE_DEBUG', () => {
    it('is false by default (env not set)', async () => {
      vi.stubEnv('VITE_ENABLE_DEBUG', '')
      const { ENABLE_DEBUG } = await import('@/config/env')
      expect(ENABLE_DEBUG).toBe(false)
    })

    it('is true when set to "true"', async () => {
      vi.stubEnv('VITE_ENABLE_DEBUG', 'true')
      const { ENABLE_DEBUG } = await import('@/config/env')
      expect(ENABLE_DEBUG).toBe(true)
    })

    it('is true when set to "TRUE" (case-insensitive)', async () => {
      vi.stubEnv('VITE_ENABLE_DEBUG', 'TRUE')
      const { ENABLE_DEBUG } = await import('@/config/env')
      expect(ENABLE_DEBUG).toBe(true)
    })

    it('is false when set to "false"', async () => {
      vi.stubEnv('VITE_ENABLE_DEBUG', 'false')
      const { ENABLE_DEBUG } = await import('@/config/env')
      expect(ENABLE_DEBUG).toBe(false)
    })

    it('is false for arbitrary non-"true" strings', async () => {
      vi.stubEnv('VITE_ENABLE_DEBUG', '1')
      const { ENABLE_DEBUG } = await import('@/config/env')
      expect(ENABLE_DEBUG).toBe(false)
    })
  })

  describe('appConfig frozen object', () => {
    it('is frozen', async () => {
      const { appConfig } = await import('@/config/env')
      expect(Object.isFrozen(appConfig)).toBe(true)
    })

    it('contains the expected keys', async () => {
      const { appConfig } = await import('@/config/env')
      expect(appConfig).toHaveProperty('APP_NAME')
      expect(appConfig).toHaveProperty('STORAGE_PREFIX')
      expect(appConfig).toHaveProperty('LEGACY_STORAGE_PREFIX')
      expect(appConfig).toHaveProperty('ENABLE_DEBUG')
    })
  })
})
