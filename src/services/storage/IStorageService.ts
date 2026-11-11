export interface IStorageService {
  getItem<T>(key: string): Promise<T | null> | T | null
  setItem<T>(key: string, value: T): Promise<void> | void
  removeItem(key: string): Promise<void> | void
  clear(): Promise<void> | void
}
