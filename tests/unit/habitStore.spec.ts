import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useHabitStore } from '@/stores/habitStore'
import { InMemoryStorageService } from '@/services/storage/InMemoryStorageService'
import { getTodayDateString, getPreviousDayString } from '@/utils/date'

describe('useHabitStore', () => {
  let storage: InMemoryStorageService

  beforeEach(() => {
    setActivePinia(createPinia())
    storage = new InMemoryStorageService()
  })

  it('initializes with empty habits and completions', async () => {
    const store = useHabitStore()
    await store.initStore(storage)

    expect(store.habits).toEqual([])
    expect(store.activeHabits).toEqual([])
    expect(store.todayCompletedCount).toBe(0)
    expect(store.todayCompletionRate).toBe(0)
  })

  it('creates a habit and persists it to storage', async () => {
    const store = useHabitStore()
    await store.initStore(storage)

    const created = store.createHabit(
      { name: 'Drink Water', emoji: '💧', color: '#06b6d4' },
      storage
    )

    expect(created.id).toBeDefined()
    expect(created.name).toBe('Drink Water')
    expect(created.emoji).toBe('💧')
    expect(store.habits.length).toBe(1)

    // Verify stored
    const savedHabits = storage.getItem<unknown[]>('habits')
    expect(savedHabits?.length).toBe(1)
  })

  it('updates an existing habit', async () => {
    const store = useHabitStore()
    await store.initStore(storage)

    const habit = store.createHabit({ name: 'Reading', emoji: '📚', color: '#8b5cf6' }, storage)
    store.updateHabit(habit.id, { name: 'Read 20 pages' }, storage)

    const updated = store.habits.find((h) => h.id === habit.id)
    expect(updated?.name).toBe('Read 20 pages')
  })

  it('deletes a habit and its completions', async () => {
    const store = useHabitStore()
    await store.initStore(storage)

    const habit = store.createHabit({ name: 'Workout', emoji: '🏋️', color: '#ef4444' }, storage)
    store.toggleCompletion(habit.id, getTodayDateString(), storage)

    expect(store.habits.length).toBe(1)
    expect(store.completions[habit.id]?.length).toBe(1)

    store.deleteHabit(habit.id, storage)

    expect(store.habits.length).toBe(0)
    expect(store.completions[habit.id]).toBeUndefined()
  })

  it('toggles completion on and off correctly', async () => {
    const store = useHabitStore()
    await store.initStore(storage)

    const habit = store.createHabit({ name: 'Meditate', emoji: '🧘', color: '#10b981' }, storage)
    const today = getTodayDateString()

    // Toggle on
    const status1 = store.toggleCompletion(habit.id, today, storage)
    expect(status1).toBe(true)
    expect(store.isCompletedOnDate(habit.id, today)).toBe(true)
    expect(store.todayCompletedCount).toBe(1)
    expect(store.todayCompletionRate).toBe(100)

    // Toggle off
    const status2 = store.toggleCompletion(habit.id, today, storage)
    expect(status2).toBe(false)
    expect(store.isCompletedOnDate(habit.id, today)).toBe(false)
    expect(store.todayCompletedCount).toBe(0)
    expect(store.todayCompletionRate).toBe(0)
  })

  it('calculates streaks accurately via getStreak', async () => {
    const store = useHabitStore()
    await store.initStore(storage)

    const habit = store.createHabit({ name: 'Write Code', emoji: '💻', color: '#3b82f6' }, storage)
    const today = getTodayDateString()
    const yesterday = getPreviousDayString(today)

    expect(store.getStreak(habit.id)).toBe(0)

    store.toggleCompletion(habit.id, yesterday, storage)
    expect(store.getStreak(habit.id)).toBe(1)

    store.toggleCompletion(habit.id, today, storage)
    expect(store.getStreak(habit.id)).toBe(2)
  })

  it('loads previously stored data on initStore', async () => {
    storage.setItem('habits', [
      { id: 'h1', name: 'Existing', emoji: '⭐', color: '#eab308', createdAt: '2026-01-01' }
    ])
    storage.setItem('completions', { h1: ['2026-01-01'] })

    const store = useHabitStore()
    await store.initStore(storage)

    expect(store.habits.length).toBe(1)
    expect(store.habits[0]?.name).toBe('Existing')
    expect(store.completions['h1']).toEqual(['2026-01-01'])
  })
})
