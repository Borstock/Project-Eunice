import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import type { User } from '@supabase/supabase-js'
import { useHabitStore } from '@/stores/habitStore'
import { useAuthStore } from '@/stores/authStore'
import { localHabitRepository } from '@/services/repository/LocalHabitRepository'
import { supabaseHabitRepository } from '@/services/repository/SupabaseHabitRepository'
import type { Habit } from '@/models/habit'

describe('Data Migration', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    localStorage.clear()
    await localHabitRepository.clearAll()
    await supabaseHabitRepository.clearCache()
    vi.clearAllMocks()
  })

  it('detects real local habits and opens migration prompt', async () => {
    const authStore = useAuthStore()
    authStore.user = { id: 'user-abc', email: 'test@example.com' } as unknown as User

    const realHabit: Habit = {
      id: 'h-real',
      name: 'Drink Water',
      emoji: '💧',
      color: '#3b82f6',
      createdAt: '2026-01-01T00:00:00Z',
      isDemo: false
    }
    await localHabitRepository.saveHabit(realHabit)
    await localHabitRepository.toggleCompletion('h-real', '2026-01-01', true)

    const habitStore = useHabitStore()
    await habitStore.checkMigrationNeeded()

    expect(habitStore.migrationPromptOpen).toBe(true)
    expect(habitStore.localMigrationCandidate?.habits).toHaveLength(1)
    expect(habitStore.localMigrationCandidate?.completionsCount).toBe(1)
  })

  it('does NOT open migration prompt when only demo habits exist', async () => {
    const authStore = useAuthStore()
    authStore.user = { id: 'user-abc', email: 'test@example.com' } as unknown as User

    const demoHabit: Habit = {
      id: 'h-demo',
      name: 'Demo Habit',
      emoji: '🎯',
      color: '#3b82f6',
      createdAt: '2026-01-01T00:00:00Z',
      isDemo: true
    }
    await localHabitRepository.saveHabit(demoHabit)

    const habitStore = useHabitStore()
    await habitStore.checkMigrationNeeded()

    expect(habitStore.migrationPromptOpen).toBe(false)
    expect(habitStore.localMigrationCandidate).toBeNull()
  })

  it('uploads real habits on confirmation and only clears local storage after success', async () => {
    const authStore = useAuthStore()
    authStore.user = { id: 'user-abc', email: 'test@example.com' } as unknown as User

    const realHabit: Habit = {
      id: 'h-real',
      name: 'Drink Water',
      emoji: '💧',
      color: '#3b82f6',
      createdAt: '2026-01-01T00:00:00Z',
      isDemo: false
    }
    await localHabitRepository.saveHabit(realHabit)
    await localHabitRepository.toggleCompletion('h-real', '2026-01-01', true)

    const uploadSpy = vi
      .spyOn(supabaseHabitRepository, 'uploadMigrationData')
      .mockResolvedValueOnce({ uploadedHabits: 1, uploadedCompletions: 1 })
    vi.spyOn(supabaseHabitRepository, 'getHabits').mockResolvedValueOnce([realHabit])
    vi.spyOn(supabaseHabitRepository, 'getCompletions').mockResolvedValueOnce({
      'h-real': ['2026-01-01']
    })

    const habitStore = useHabitStore()
    await habitStore.checkMigrationNeeded()
    await habitStore.executeMigration()

    expect(uploadSpy).toHaveBeenCalled()
    expect(habitStore.migrationPromptOpen).toBe(false)

    // Local storage is cleared now that migration succeeded
    const localRemaining = await localHabitRepository.getHabits()
    expect(localRemaining).toHaveLength(0)
  })

  it('preserves local storage if upload fails', async () => {
    const authStore = useAuthStore()
    authStore.user = { id: 'user-abc', email: 'test@example.com' } as unknown as User

    const realHabit: Habit = {
      id: 'h-real',
      name: 'Drink Water',
      emoji: '💧',
      color: '#3b82f6',
      createdAt: '2026-01-01T00:00:00Z',
      isDemo: false
    }
    await localHabitRepository.saveHabit(realHabit)

    vi.spyOn(supabaseHabitRepository, 'uploadMigrationData').mockRejectedValueOnce(
      new Error('Network error during migration')
    )

    const habitStore = useHabitStore()
    await habitStore.checkMigrationNeeded()

    await expect(habitStore.executeMigration()).rejects.toThrow('Network error')

    // Local habits MUST still exist
    const localRemaining = await localHabitRepository.getHabits()
    expect(localRemaining).toHaveLength(1)
    expect(localRemaining[0]?.id).toBe('h-real')
  })

  it('allows safe retry without duplicates', async () => {
    const authStore = useAuthStore()
    authStore.user = { id: 'user-abc', email: 'test@example.com' } as unknown as User

    const realHabit: Habit = {
      id: 'h-real',
      name: 'Drink Water',
      emoji: '💧',
      color: '#3b82f6',
      createdAt: '2026-01-01T00:00:00Z',
      isDemo: false
    }
    await localHabitRepository.saveHabit(realHabit)

    const uploadSpy = vi.spyOn(supabaseHabitRepository, 'uploadMigrationData')
    // First attempt fails
    uploadSpy.mockRejectedValueOnce(new Error('Temporary drop'))
    // Second attempt succeeds
    uploadSpy.mockResolvedValueOnce({ uploadedHabits: 1, uploadedCompletions: 0 })
    vi.spyOn(supabaseHabitRepository, 'getHabits').mockResolvedValueOnce([realHabit])
    vi.spyOn(supabaseHabitRepository, 'getCompletions').mockResolvedValueOnce({})

    const habitStore = useHabitStore()
    await habitStore.checkMigrationNeeded()

    // 1st attempt fails
    await expect(habitStore.executeMigration()).rejects.toThrow('Temporary drop')
    expect(await localHabitRepository.getHabits()).toHaveLength(1)

    // 2nd attempt succeeds
    await habitStore.executeMigration()
    expect(uploadSpy).toHaveBeenCalledTimes(2)
    expect(await localHabitRepository.getHabits()).toHaveLength(0)
  })

  it('dismisses migration when user chooses "Start empty"', async () => {
    const authStore = useAuthStore()
    authStore.user = { id: 'user-abc', email: 'test@example.com' } as unknown as User

    const realHabit: Habit = {
      id: 'h-real',
      name: 'Drink Water',
      emoji: '💧',
      color: '#3b82f6',
      createdAt: '2026-01-01T00:00:00Z',
      isDemo: false
    }
    await localHabitRepository.saveHabit(realHabit)

    const habitStore = useHabitStore()
    await habitStore.checkMigrationNeeded()
    expect(habitStore.migrationPromptOpen).toBe(true)

    habitStore.dismissMigration(true)

    expect(habitStore.migrationPromptOpen).toBe(false)
    expect(habitStore.localMigrationCandidate).toBeNull()

    // Marked as dismissed in localStorage
    expect(localStorage.getItem('migration_dismissed_user-abc')).toBe('true')
  })

  it('triggers migration flow on initStore when authenticated and local habits exist with empty cloud', async () => {
    const authStore = useAuthStore()
    authStore.user = { id: 'user-abc', email: 'test@example.com' } as unknown as User
    authStore.session = {
      access_token: 'token'
    } as unknown as import('@supabase/supabase-js').Session

    const realHabit: Habit = {
      id: 'h-local',
      name: 'Running',
      emoji: '🏃',
      color: '#ef4444',
      createdAt: '2026-01-01T00:00:00Z',
      isDemo: false
    }
    await localHabitRepository.saveHabit(realHabit)

    vi.spyOn(supabaseHabitRepository, 'getHabits').mockResolvedValueOnce([])
    vi.spyOn(supabaseHabitRepository, 'getCompletions').mockResolvedValueOnce({})

    const habitStore = useHabitStore()
    await habitStore.initStore()

    // Migration prompt must be open
    expect(habitStore.migrationPromptOpen).toBe(true)
    expect(habitStore.localMigrationCandidate?.habits).toHaveLength(1)
    // Habits in UI must still show local habits while deciding
    expect(habitStore.habits).toHaveLength(1)
    expect(habitStore.habits[0]?.name).toBe('Running')
    // Navbar sync status must NOT falsely report 'synced'
    expect(habitStore.syncStatus).toBe('syncing')
  })

  it('preserves local storage when choosing "Start empty"', async () => {
    const authStore = useAuthStore()
    authStore.user = { id: 'user-abc', email: 'test@example.com' } as unknown as User

    const realHabit: Habit = {
      id: 'h-local',
      name: 'Meditation',
      emoji: '🧘',
      color: '#10b981',
      createdAt: '2026-01-01T00:00:00Z',
      isDemo: false
    }
    await localHabitRepository.saveHabit(realHabit)

    const habitStore = useHabitStore()
    await habitStore.checkMigrationNeeded()
    habitStore.dismissMigration(true)

    // Local storage is preserved
    const remaining = await localHabitRepository.getHabits()
    expect(remaining).toHaveLength(1)
    expect(remaining[0]?.name).toBe('Meditation')

    // But current store state starts empty
    expect(habitStore.habits).toHaveLength(0)
    expect(habitStore.syncStatus).toBe('synced')
  })
})
