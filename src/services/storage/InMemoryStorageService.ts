import type { IStorageService } from './IStorageService'

export class InMemoryStorageService implements IStorageService {
  private store: Map<string, string> = new Map()

  getItem<T>(key: string): T | null {
    const raw = this.store.get(key)
    if (raw === undefined) {
      return null
    }
    try {
      return JSON.parse(raw) as T
    } catch {
      return null
    }
  }

  setItem<T>(key: string, value: T): void {
    this.store.set(key, JSON.stringify(value))
  }

  removeItem(key: string): void {
    this.store.delete(key)
  }

  clear(): void {
    this.store.clear()
  }
}
