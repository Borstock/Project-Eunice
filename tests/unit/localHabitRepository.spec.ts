import { describe, it, expect, beforeEach } from 'vitest'
import { LocalHabitRepository } from '@/services/repository/LocalHabitRepository'
import { InMemoryStorageService } from '@/services/storage/InMemoryStorageService'
import type { Habit } from '@/models/habit'

describe('LocalHabitRepository', () => {
  let storage: InMemoryStorageService
  let repo: LocalHabitRepository

  beforeEach(() => {
    storage = new InMemoryStorageService()
    repo = new LocalHabitRepository(storage)
  })

  it('saves and retrieves habits', async () => {
    const habit: Habit = {
      id: 'h-1',
      name: 'Read Books',
      emoji: '📚',
      color: '#6366f1',
      createdAt: '2026-01-01T00:00:00Z'
    }

    await repo.saveHabit(habit)
    const habits = await repo.getHabits()

    expect(habits).toHaveLength(1)
    expect(habits[0]).toEqual(habit)
  })

  it('updates an existing habit', async () => {
    const habit: Habit = {
      id: 'h-1',
      name: 'Read Books',
      emoji: '📚',
      color: '#6366f1',
      createdAt: '2026-01-01T00:00:00Z'
    }

    await repo.saveHabit(habit)
    await repo.updateHabit('h-1', { name: 'Read 20 Pages', emoji: '📖' })

    const updated = await repo.getHabits()
    expect(updated[0]?.name).toBe('Read 20 Pages')
    expect(updated[0]?.emoji).toBe('📖')
  })

  it('deletes habit and cleans up completions', async () => {
    const habit: Habit = {
      id: 'h-1',
      name: 'Run',
      emoji: '🏃',
      color: '#ef4444',
      createdAt: '2026-01-01T00:00:00Z'
    }

    await repo.saveHabit(habit)
    await repo.toggleCompletion('h-1', '2026-01-02', true)

    let completions = await repo.getCompletions()
    expect(completions['h-1']).toContain('2026-01-02')

    await repo.deleteHabit('h-1')
    const remaining = await repo.getHabits()
    expect(remaining).toHaveLength(0)

    completions = await repo.getCompletions()
    expect(completions['h-1']).toBeUndefined()
  })

  it('toggles completions idempotently', async () => {
    await repo.toggleCompletion('h-1', '2026-01-05', true)
    let completions = await repo.getCompletions()
    expect(completions['h-1']).toEqual(['2026-01-05'])

    // Toggling true again does not add duplicate
    await repo.toggleCompletion('h-1', '2026-01-05', true)
    completions = await repo.getCompletions()
    expect(completions['h-1']).toEqual(['2026-01-05'])

    // Toggling false removes it
    await repo.toggleCompletion('h-1', '2026-01-05', false)
    completions = await repo.getCompletions()
    expect(completions['h-1']).toEqual([])
  })

  it('deletes only demo habits and their history', async () => {
    const realHabit: Habit = {
      id: 'real-1',
      name: 'Real Habit',
      emoji: '🎯',
      color: '#10b981',
      createdAt: '2026-01-01T00:00:00Z',
      isDemo: false
    }

    const demoHabit: Habit = {
      id: 'demo-1',
      name: 'Demo Habit',
      emoji: '🧪',
      color: '#f59e0b',
      createdAt: '2026-01-01T00:00:00Z',
      isDemo: true
    }

    await repo.saveHabit(realHabit)
    await repo.saveHabit(demoHabit)
    await repo.toggleCompletion('real-1', '2026-01-01', true)
    await repo.toggleCompletion('demo-1', '2026-01-01', true)

    await repo.deleteDemoData()

    const habits = await repo.getHabits()
    expect(habits).toHaveLength(1)
    expect(habits[0]?.id).toBe('real-1')

    const completions = await repo.getCompletions()
    expect(completions['real-1']).toBeDefined()
    expect(completions['demo-1']).toBeUndefined()
  })
})
