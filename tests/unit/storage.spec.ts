import { describe, it, expect, beforeEach } from 'vitest'
import { LocalStorageService } from '@/services/storage/LocalStorageService'
import { InMemoryStorageService } from '@/services/storage/InMemoryStorageService'

describe('LocalStorageService', () => {
  let service: LocalStorageService

  beforeEach(() => {
    localStorage.clear()
    service = new LocalStorageService('test_')
  })

  it('stores and retrieves JSON serializable objects', () => {
    const data = { id: '1', name: 'Exercise', active: true }
    service.setItem('habit_1', data)
    const result = service.getItem<typeof data>('habit_1')
    expect(result).toEqual(data)
  })

  it('returns null for non-existent keys', () => {
    expect(service.getItem('unknown')).toBeNull()
  })

  it('removes item properly', () => {
    service.setItem('key_to_remove', 'value')
    expect(service.getItem('key_to_remove')).toBe('value')
    service.removeItem('key_to_remove')
    expect(service.getItem('key_to_remove')).toBeNull()
  })

  it('clears only items with the configured prefix', () => {
    service.setItem('item1', 'val1')
    service.setItem('item2', 'val2')
    localStorage.setItem('other_app_key', 'keep_me')

    service.clear()

    expect(service.getItem('item1')).toBeNull()
    expect(service.getItem('item2')).toBeNull()
    expect(localStorage.getItem('other_app_key')).toBe('keep_me')
  })

  it('handles invalid JSON gracefully', () => {
    localStorage.setItem('test_corrupted', '{ invalid json')
    expect(service.getItem('corrupted')).toBeNull()
  })
})

describe('InMemoryStorageService', () => {
  let memoryStorage: InMemoryStorageService

  beforeEach(() => {
    memoryStorage = new InMemoryStorageService()
  })

  it('saves and reads values in memory', () => {
    memoryStorage.setItem('test', [1, 2, 3])
    expect(memoryStorage.getItem<number[]>('test')).toEqual([1, 2, 3])
  })

  it('clears store on clear()', () => {
    memoryStorage.setItem('key', 'val')
    memoryStorage.clear()
    expect(memoryStorage.getItem('key')).toBeNull()
  })
})
