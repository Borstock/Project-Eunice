import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SupabaseHabitRepository } from '@/services/repository/SupabaseHabitRepository'
import { InMemoryStorageService } from '@/services/storage/InMemoryStorageService'
import type { Habit } from '@/models/habit'

let lastResult: unknown = { data: null, error: null }

const mockSelect = vi.fn()
const mockInsert = vi.fn()
const mockUpsert = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
const mockEq = vi.fn()
const mockMatch = vi.fn()
const mockOrder = vi.fn()

const mockQueryBuilder = {
  select: (...args: unknown[]) => {
    lastResult = mockSelect(...args)
    return mockQueryBuilder
  },
  insert: (...args: unknown[]) => {
    lastResult = mockInsert(...args)
    return mockQueryBuilder
  },
  upsert: (...args: unknown[]) => {
    lastResult = mockUpsert(...args)
    return mockQueryBuilder
  },
  update: (...args: unknown[]) => {
    lastResult = mockUpdate(...args)
    return mockQueryBuilder
  },
  delete: (...args: unknown[]) => {
    lastResult = mockDelete(...args)
    return mockQueryBuilder
  },
  eq: (...args: unknown[]) => {
    lastResult = mockEq(...args)
    return mockQueryBuilder
  },
  match: (...args: unknown[]) => {
    lastResult = mockMatch(...args)
    return mockQueryBuilder
  },
  order: (...args: unknown[]) => {
    lastResult = mockOrder(...args)
    return mockQueryBuilder
  },
  then: (onFulfilled?: (value: unknown) => unknown, onRejected?: (reason: unknown) => unknown) => {
    return Promise.resolve(lastResult).then(onFulfilled, onRejected)
  }
}

const mockGetUser = vi.fn()

vi.mock('@/services/supabase/client', () => ({
  getSupabase: () => ({
    auth: {
      getUser: () => mockGetUser()
    },
    from: () => mockQueryBuilder
  })
}))

describe('SupabaseHabitRepository', () => {
  let cache: InMemoryStorageService
  let repo: SupabaseHabitRepository

  beforeEach(() => {
    vi.clearAllMocks()
    lastResult = { data: null, error: null }
    mockSelect.mockReturnValue({ data: null, error: null })
    mockInsert.mockReturnValue({ data: null, error: null })
    mockUpsert.mockReturnValue({ data: null, error: null })
    mockUpdate.mockReturnValue({ data: null, error: null })
    mockDelete.mockReturnValue({ data: null, error: null })
    mockEq.mockReturnValue({ data: null, error: null })
    mockMatch.mockReturnValue({ data: null, error: null })
    mockOrder.mockReturnValue({ data: null, error: null })
    cache = new InMemoryStorageService()
    repo = new SupabaseHabitRepository(cache)
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null })
  })

  it('fetches habits for the authenticated user and caches them', async () => {
    const dbHabits = [
      {
        id: 'h-1',
        name: 'Exercise',
        emoji: '💪',
        color: '#6366f1',
        archived: false,
        is_demo: false,
        created_at: '2026-01-01T00:00:00Z'
      }
    ]
    mockOrder.mockResolvedValueOnce({ data: dbHabits, error: null })

    const habits = await repo.getHabits()

    expect(habits).toHaveLength(1)
    expect(habits[0]?.name).toBe('Exercise')
    expect(mockEq).toHaveBeenCalledWith('user_id', 'user-123')

    // Verify written to local cache
    const cached = await repo.getCachedHabits()
    expect(cached).toEqual(habits)
  })

  it('saves habit scoped to user_id', async () => {
    mockUpsert.mockResolvedValueOnce({ error: null })

    const habit: Habit = {
      id: 'h-2',
      name: 'Meditate',
      emoji: '🧘',
      color: '#10b981',
      createdAt: '2026-01-02T00:00:00Z'
    }

    await repo.saveHabit(habit)

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'h-2',
        user_id: 'user-123',
        name: 'Meditate'
      }),
      { onConflict: 'id' }
    )
  })

  it('updates habit matching id and user_id', async () => {
    mockMatch.mockResolvedValueOnce({ error: null })

    await repo.updateHabit('h-1', { name: 'Run 5km' })

    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ name: 'Run 5km' }))
    expect(mockMatch).toHaveBeenCalledWith({ id: 'h-1', user_id: 'user-123' })
  })

  it('deletes habit matching id and user_id', async () => {
    mockMatch.mockResolvedValueOnce({ error: null })

    await repo.deleteHabit('h-1')

    expect(mockDelete).toHaveBeenCalled()
    expect(mockMatch).toHaveBeenCalledWith({ id: 'h-1', user_id: 'user-123' })
  })

  it('fetches completions and aggregates them into dictionary', async () => {
    const dbCompletions = [
      { habit_id: 'h-1', date: '2026-01-01' },
      { habit_id: 'h-1', date: '2026-01-02' },
      { habit_id: 'h-2', date: '2026-01-01' }
    ]
    mockEq.mockResolvedValueOnce({ data: dbCompletions, error: null })

    const completions = await repo.getCompletions()

    expect(completions['h-1']).toEqual(['2026-01-01', '2026-01-02'])
    expect(completions['h-2']).toEqual(['2026-01-01'])
    expect(mockEq).toHaveBeenCalledWith('user_id', 'user-123')

    // Verify written to local cache
    const cached = await repo.getCachedCompletions()
    expect(cached).toEqual(completions)
  })

  it('toggles completion true (upsert) and false (delete)', async () => {
    mockUpsert.mockResolvedValueOnce({ error: null })
    await repo.toggleCompletion('h-1', '2026-01-03', true)
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        habit_id: 'h-1',
        user_id: 'user-123',
        date: '2026-01-03'
      }),
      { onConflict: 'habit_id,date' }
    )

    mockMatch.mockResolvedValueOnce({ error: null })
    await repo.toggleCompletion('h-1', '2026-01-03', false)
    expect(mockDelete).toHaveBeenCalled()
    expect(mockMatch).toHaveBeenCalledWith({
      habit_id: 'h-1',
      user_id: 'user-123',
      date: '2026-01-03'
    })
  })

  it('clears all cloud data and clears cache', async () => {
    mockEq.mockResolvedValueOnce({ error: null })
    await cache.setItem('cloud_cached_habits', [{ id: '1' }])

    await repo.clearAll()

    expect(mockDelete).toHaveBeenCalled()
    expect(mockEq).toHaveBeenCalledWith('user_id', 'user-123')
    expect(await repo.getCachedHabits()).toBeNull()
  })

  it('uploads migration data excluding demo habits', async () => {
    mockUpsert.mockResolvedValue({ error: null })

    const validId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
    const habits: Habit[] = [
      {
        id: validId,
        name: 'Real Habit',
        emoji: '🎯',
        color: '#10b981',
        createdAt: '2026-01-01T00:00:00Z',
        isDemo: false
      },
      {
        id: 'demo-1',
        name: 'Demo Habit',
        emoji: '🧪',
        color: '#f59e0b',
        createdAt: '2026-01-01T00:00:00Z',
        isDemo: true
      }
    ]

    const completions = {
      [validId]: ['2026-01-01', '2026-01-02'],
      'demo-1': ['2026-01-01']
    }

    const result = await repo.uploadMigrationData(habits, completions)

    expect(result.uploadedHabits).toBe(1)
    expect(result.uploadedCompletions).toBe(2)

    // Check that demo-1 was excluded from the upserts
    expect(mockUpsert).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          id: validId,
          user_id: 'user-123',
          is_demo: false
        })
      ],
      { onConflict: 'id' }
    )

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ habit_id: validId, date: '2026-01-01' }),
        expect.objectContaining({ habit_id: validId, date: '2026-01-02' })
      ]),
      { onConflict: 'habit_id,date' }
    )
  })

  it('safely converts legacy non-UUID habit ids to valid UUIDs and remaps completions', async () => {
    mockUpsert.mockResolvedValue({ error: null })

    const legacyHabit: Habit = {
      id: 'legacy_habit_123',
      name: 'Legacy Habit',
      emoji: '📜',
      color: '#3b82f6',
      createdAt: '2026-01-01T00:00:00Z',
      isDemo: false
    }

    const completions = {
      legacy_habit_123: ['2026-01-01']
    }

    const result = await repo.uploadMigrationData([legacyHabit], completions)

    expect(result.uploadedHabits).toBe(1)
    expect(result.uploadedCompletions).toBe(1)

    // Inspect the generated UUID used in habit upsert
    const habitUpsertCall = mockUpsert.mock.calls.find(
      (call) => Array.isArray(call[0]) && (call[0] as Array<Record<string, unknown>>)[0]?.name === 'Legacy Habit'
    )
    expect(habitUpsertCall).toBeDefined()
    const generatedHabitId = (habitUpsertCall as unknown[][])?.[0]?.[0] as Record<string, unknown> | undefined
    const habitId = generatedHabitId?.id as string | undefined
    expect(habitId).not.toBe('legacy_habit_123')
    expect(habitId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    )

    // Check completion was remapped to the generated UUID
    const compUpsertCall = mockUpsert.mock.calls.find(
      (call) => Array.isArray(call[0]) && (call[0] as Array<Record<string, unknown>>)[0]?.date === '2026-01-01'
    )
    expect(compUpsertCall).toBeDefined()
    const compRow = (compUpsertCall as unknown[][])?.[0]?.[0] as Record<string, unknown> | undefined
    expect(compRow?.habit_id).toBe(habitId)
  })
})
