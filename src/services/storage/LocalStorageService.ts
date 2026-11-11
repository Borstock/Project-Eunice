import type { IStorageService } from './IStorageService'

export class LocalStorageService implements IStorageService {
  private readonly prefix: string

  constructor(prefix = 'habit_tracker_') {
    this.prefix = prefix
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`
  }

  getItem<T>(key: string): T | null {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return null
      }
      const raw = window.localStorage.getItem(this.getKey(key))
      if (raw === null) {
        return null
      }
      return JSON.parse(raw) as T
    } catch (error) {
      console.warn(`[LocalStorageService] Failed to read key "${key}":`, error)
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
      console.error(`[LocalStorageService] Failed to write key "${key}":`, error)
    }
  }

  removeItem(key: string): void {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return
      }
      window.localStorage.removeItem(this.getKey(key))
    } catch (error) {
      console.error(`[LocalStorageService] Failed to remove key "${key}":`, error)
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
      console.error('[LocalStorageService] Failed to clear keys:', error)
    }
  }
}

export const localStorageService = new LocalStorageService()
