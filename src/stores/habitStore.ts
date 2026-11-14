import { defineStore } from 'pinia'
import type { Habit, HabitWithStatus } from '@/models/habit'
import type { IStorageService } from '@/services/storage/IStorageService'
import type { IHabitRepository } from '@/services/repository/IHabitRepository'
import {
  LocalHabitRepository,
  localHabitRepository
} from '@/services/repository/LocalHabitRepository'
import {
  SupabaseHabitRepository,
  supabaseHabitRepository
} from '@/services/repository/SupabaseHabitRepository'
import { useAuthStore } from '@/stores/authStore'
import { getTodayDateString } from '@/utils/date'
import { calculateCurrentStreak } from '@/utils/streak'
import { generateDemoData } from '@/utils/demoGenerator'
import { generateUUID } from '@/utils/uuid'

export type SyncStatus = 'synced' | 'syncing' | 'error'

export interface HabitStoreState {
  habits: Habit[]
  completions: Record<string, string[]> // habitId -> string[] of YYYY-MM-DD
  selectedDate: string
  syncStatus: SyncStatus
  syncError: string | null
  migrationPromptOpen: boolean
  localMigrationCandidate: {
    habits: Habit[]
    completionsCount: number
  } | null
  migrationLoading: boolean
}

function resolveRepository(
  repoOrStorage?: IHabitRepository | IStorageService,
  authStore?: ReturnType<typeof useAuthStore>
): IHabitRepository {
  if (repoOrStorage) {
    if ('getHabits' in repoOrStorage) {
      return repoOrStorage
    }
    return new LocalHabitRepository(repoOrStorage)
  }

  const auth = authStore ?? useAuthStore()
  return auth.isAuthenticated ? supabaseHabitRepository : localHabitRepository
}

export const useHabitStore = defineStore('habit', {
  state: (): HabitStoreState => ({
    habits: [],
    completions: {},
    selectedDate: getTodayDateString(),
    syncStatus: 'synced',
    syncError: null,
    migrationPromptOpen: false,
    localMigrationCandidate: null,
    migrationLoading: false
  }),

  getters: {
    activeHabits: (state): Habit[] => {
      return state.habits.filter((h) => !h.archived)
    },

    habitsWithStatus(): HabitWithStatus[] {
      const today = getTodayDateString()
      return this.activeHabits.map((habit) => {
        const habitCompletions = this.completions[habit.id] || []
        const isCompletedToday = habitCompletions.includes(today)
        const currentStreak = calculateCurrentStreak(habitCompletions, today)
        return {
          ...habit,
          isCompletedToday,
          currentStreak
        }
      })
    },

    todayCompletedCount(): number {
      const today = getTodayDateString()
      return this.activeHabits.filter((habit) => {
        const habitCompletions = this.completions[habit.id] || []
        return habitCompletions.includes(today)
      }).length
    },

    todayCompletionRate(): number {
      if (this.activeHabits.length === 0) return 0
      return Math.round((this.todayCompletedCount / this.activeHabits.length) * 100)
    }
  },

  actions: {
    async initStore(repoOrStorage?: IHabitRepository | IStorageService): Promise<void> {
      const authStore = useAuthStore()
      const repo = resolveRepository(repoOrStorage, authStore)

      if (authStore.isAuthenticated && repo instanceof SupabaseHabitRepository) {
        // Fast instant render from cache if available
        const cachedHabits = await repo.getCachedHabits()
        if (cachedHabits && Array.isArray(cachedHabits)) {
          this.habits = cachedHabits
        }
        const cachedCompletions = await repo.getCachedCompletions()
        if (cachedCompletions) {
          this.completions = cachedCompletions
        }

        // Check if first-login migration from local storage is needed
        await this.checkMigrationNeeded()

        // Background network sync
        await this.syncFromCloud(repo)
      } else {
        // Guest mode: load strictly from local repository
        this.syncStatus = 'synced'
        this.syncError = null
        try {
          this.habits = await repo.getHabits()
          this.completions = await repo.getCompletions()
        } catch (err) {
          this.syncStatus = 'error'
          this.syncError = (err as Error).message
        }
      }
    },

    async syncFromCloud(repo: SupabaseHabitRepository): Promise<void> {
      this.syncStatus = 'syncing'
      this.syncError = null
      try {
        const [cloudHabits, cloudCompletions] = await Promise.all([
          repo.getHabits(),
          repo.getCompletions()
        ])
        this.habits = cloudHabits
        this.completions = cloudCompletions
        this.syncStatus = 'synced'
      } catch (err) {
        this.syncStatus = 'error'
        this.syncError = (err as Error).message
      }
    },

    async retrySync(): Promise<void> {
      await this.initStore()
    },

    createHabit(
      payload: { name: string; emoji: string; color: string },
      repoOrStorage?: IHabitRepository | IStorageService
    ): Habit {
      const repo = resolveRepository(repoOrStorage)
      const newHabit: Habit = {
        id: generateUUID(),
        name: payload.name.trim(),
        emoji: payload.emoji || '🎯',
        color: payload.color || '#4f46e5',
        createdAt: new Date().toISOString()
      }

      // Optimistic update
      this.habits.push(newHabit)
      if (!this.completions[newHabit.id]) {
        this.completions[newHabit.id] = []
      }

      // Background persist
      this.syncStatus = 'syncing'
      repo
        .saveHabit(newHabit)
        .then(() => {
          this.syncStatus = 'synced'
          this.syncError = null
        })
        .catch((err: Error) => {
          this.syncStatus = 'error'
          this.syncError = err.message
        })

      return newHabit
    },

    updateHabit(
      id: string,
      updates: Partial<Pick<Habit, 'name' | 'emoji' | 'color' | 'archived'>>,
      repoOrStorage?: IHabitRepository | IStorageService
    ): void {
      const repo = resolveRepository(repoOrStorage)
      const index = this.habits.findIndex((h) => h.id === id)
      if (index === -1) return

      const current = this.habits[index]
      if (!current) return

      // Optimistic update
      this.habits[index] = {
        ...current,
        ...updates,
        name: updates.name !== undefined ? updates.name.trim() : current.name
      }

      this.syncStatus = 'syncing'
      repo
        .updateHabit(id, updates)
        .then(() => {
          this.syncStatus = 'synced'
          this.syncError = null
        })
        .catch((err: Error) => {
          this.syncStatus = 'error'
          this.syncError = err.message
        })
    },

    deleteHabit(id: string, repoOrStorage?: IHabitRepository | IStorageService): void {
      const repo = resolveRepository(repoOrStorage)

      // Optimistic update
      this.habits = this.habits.filter((h) => h.id !== id)
      delete this.completions[id]

      this.syncStatus = 'syncing'
      repo
        .deleteHabit(id)
        .then(() => {
          this.syncStatus = 'synced'
          this.syncError = null
        })
        .catch((err: Error) => {
          this.syncStatus = 'error'
          this.syncError = err.message
        })
    },

    toggleCompletion(
      habitId: string,
      date: string = getTodayDateString(),
      repoOrStorage?: IHabitRepository | IStorageService
    ): boolean {
      const repo = resolveRepository(repoOrStorage)

      if (!this.completions[habitId]) {
        this.completions[habitId] = []
      }

      const list = this.completions[habitId] || []
      const index = list.indexOf(date)
      let isNowCompleted = false

      // Optimistic update
      if (index > -1) {
        list.splice(index, 1)
        isNowCompleted = false
      } else {
        list.push(date)
        isNowCompleted = true
      }

      this.syncStatus = 'syncing'
      repo
        .toggleCompletion(habitId, date, isNowCompleted)
        .then(() => {
          this.syncStatus = 'synced'
          this.syncError = null
        })
        .catch((err: Error) => {
          this.syncStatus = 'error'
          this.syncError = err.message
        })

      return isNowCompleted
    },

    isCompletedOnDate(habitId: string, date: string): boolean {
      const list = this.completions[habitId] || []
      return list.includes(date)
    },

    getStreak(habitId: string, referenceDate: string = getTodayDateString()): number {
      const list = this.completions[habitId] || []
      return calculateCurrentStreak(list, referenceDate)
    },

    // -----------------------------------------------------------------------
    // Demo data
    // -----------------------------------------------------------------------

    hasDemoData(): boolean {
      return this.habits.some((h) => h.isDemo)
    },

    loadDemoData(repoOrStorage?: IHabitRepository | IStorageService): void {
      const repo = resolveRepository(repoOrStorage)
      const { habits: demoHabits, completions: demoCompletions } = generateDemoData()

      for (const demoHabit of demoHabits) {
        if (!this.habits.find((h) => h.id === demoHabit.id)) {
          this.habits.push(demoHabit)
        }
        if (!this.completions[demoHabit.id]) {
          this.completions[demoHabit.id] = demoCompletions[demoHabit.id] ?? []
        }
      }

      this.syncStatus = 'syncing'
      Promise.all(
        demoHabits.map((h) =>
          repo.saveHabit(h).then(() => repo.setCompletions(h.id, demoCompletions[h.id] ?? []))
        )
      )
        .then(() => {
          this.syncStatus = 'synced'
          this.syncError = null
        })
        .catch((err: Error) => {
          this.syncStatus = 'error'
          this.syncError = err.message
        })
    },

    removeDemoData(repoOrStorage?: IHabitRepository | IStorageService): void {
      const repo = resolveRepository(repoOrStorage)
      const demoIds = this.habits.filter((h) => h.isDemo).map((h) => h.id)

      this.habits = this.habits.filter((h) => !h.isDemo)
      for (const id of demoIds) {
        delete this.completions[id]
      }

      this.syncStatus = 'syncing'
      repo
        .deleteDemoData()
        .then(() => {
          this.syncStatus = 'synced'
          this.syncError = null
        })
        .catch((err: Error) => {
          this.syncStatus = 'error'
          this.syncError = err.message
        })
    },

    // -----------------------------------------------------------------------
    // Account Cloud Data Deletion
    // -----------------------------------------------------------------------

    async deleteCloudData(): Promise<void> {
      this.syncStatus = 'syncing'
      try {
        await supabaseHabitRepository.clearAll()
        this.habits = []
        this.completions = {}
        this.syncStatus = 'synced'
        this.syncError = null
      } catch (err) {
        this.syncStatus = 'error'
        this.syncError = (err as Error).message
        throw err
      }
    },

    // -----------------------------------------------------------------------
    // First-Login Migration
    // -----------------------------------------------------------------------

    async checkMigrationNeeded(): Promise<void> {
      const authStore = useAuthStore()
      if (!authStore.isAuthenticated || !authStore.user) return

      const dismissedKey = `migration_dismissed_${authStore.user.id}`
      if (typeof window !== 'undefined' && localStorage.getItem(dismissedKey)) {
        return
      }

      try {
        const localHabits = await localHabitRepository.getHabits()
        const realHabits = localHabits.filter((h) => !h.isDemo)

        if (realHabits.length > 0) {
          const localCompletions = await localHabitRepository.getCompletions()
          const realIds = new Set(realHabits.map((h) => h.id))
          let completionsCount = 0
          for (const [habitId, dates] of Object.entries(localCompletions)) {
            if (realIds.has(habitId) && Array.isArray(dates)) {
              completionsCount += dates.length
            }
          }

          this.localMigrationCandidate = {
            habits: realHabits,
            completionsCount
          }
          this.migrationPromptOpen = true
        }
      } catch {
        // Non-blocking if reading local fails
      }
    },

    async executeMigration(): Promise<void> {
      if (!this.localMigrationCandidate) return

      this.migrationLoading = true
      try {
        const localCompletions = await localHabitRepository.getCompletions()
        await supabaseHabitRepository.uploadMigrationData(
          this.localMigrationCandidate.habits,
          localCompletions
        )

        // Clear local storage habits only after upload confirms successful
        await localHabitRepository.clearAll()

        const authStore = useAuthStore()
        if (authStore.user && typeof window !== 'undefined') {
          localStorage.setItem(`migration_dismissed_${authStore.user.id}`, 'true')
        }

        this.migrationPromptOpen = false
        this.localMigrationCandidate = null

        // Sync with newly migrated cloud data
        await this.syncFromCloud(supabaseHabitRepository)
      } catch (err) {
        this.syncStatus = 'error'
        this.syncError = (err as Error).message
        throw err
      } finally {
        this.migrationLoading = false
      }
    },

    dismissMigration(startEmpty: boolean): void {
      const authStore = useAuthStore()
      if (authStore.user && typeof window !== 'undefined' && startEmpty) {
        localStorage.setItem(`migration_dismissed_${authStore.user.id}`, 'true')
      }
      this.migrationPromptOpen = false
      this.localMigrationCandidate = null
    },

    // Legacy compatibility method
    async persist(storage?: IStorageService): Promise<void> {
      const repo = resolveRepository(storage)
      if (repo instanceof LocalHabitRepository) {
        for (const habit of this.habits) {
          await repo.saveHabit(habit)
        }
        for (const [habitId, dates] of Object.entries(this.completions)) {
          await repo.setCompletions(habitId, dates)
        }
      }
    }
  }
})
