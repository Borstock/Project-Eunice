import type { IStorageService } from './IStorageService'
import { STORAGE_PREFIX, LEGACY_STORAGE_PREFIX } from '@/config/env'
import { logger } from '@/utils/logger'

export class LocalStorageService implements IStorageService {
  private readonly prefix: string
  private readonly legacyPrefix: string

  constructor(prefix = STORAGE_PREFIX, legacyPrefix = LEGACY_STORAGE_PREFIX) {
    this.prefix = prefix
    this.legacyPrefix = legacyPrefix
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`
  }

  private getLegacyKey(key: string): string {
    return `${this.legacyPrefix}${key}`
  }

  /**
   * Migrate a single key from the legacy prefix to the active prefix if the
   * active-prefix key does not yet exist. Returns true when migration happened.
   */
  private migrateKey(key: string): boolean {
    if (typeof window === 'undefined' || !window.localStorage) return false
    if (this.prefix === this.legacyPrefix) return false // nothing to migrate

    const activeKey = this.getKey(key)
    const legacyKey = this.getLegacyKey(key)

    if (window.localStorage.getItem(activeKey) === null) {
      const legacyValue = window.localStorage.getItem(legacyKey)
      if (legacyValue !== null) {
        window.localStorage.setItem(activeKey, legacyValue)
        window.localStorage.removeItem(legacyKey)
        logger.debug('LocalStorageService', `Migrated key "${key}" from legacy prefix`)
        return true
      }
    }
    return false
  }

  getItem<T>(key: string): T | null {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return null
      }
      this.migrateKey(key)
      const raw = window.localStorage.getItem(this.getKey(key))
      if (raw === null) {
        return null
      }
      return JSON.parse(raw) as T
    } catch (error) {
      logger.warn('LocalStorageService', `Failed to read key "${key}":`, error)
      return null
    }
  }

  setItem<T>(key: string, value: T): void {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return
      }
      const serialized = JSON.stringify(value)
      window.localStorage.setItem(this.getKey(key), serialized)
    } catch (error) {
      logger.error('LocalStorageService', `Failed to write key "${key}":`, error)
    }
  }

  removeItem(key: string): void {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return
      }
      window.localStorage.removeItem(this.getKey(key))
    } catch (error) {
      logger.error('LocalStorageService', `Failed to remove key "${key}":`, error)
    }
  }

  clear(): void {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return
      }
      const keysToRemove: string[] = []
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i)
        if (key && key.startsWith(this.prefix)) {
          keysToRemove.push(key)
        }
      }
      for (const key of keysToRemove) {
        window.localStorage.removeItem(key)
      }
    } catch (error) {
      logger.error('LocalStorageService', 'Failed to clear keys:', error)
    }
  }
}

export const localStorageService = new LocalStorageService()
