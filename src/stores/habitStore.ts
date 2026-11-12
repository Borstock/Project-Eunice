import { defineStore } from 'pinia'
import type { Habit, HabitWithStatus } from '@/models/habit'
import type { IStorageService } from '@/services/storage/IStorageService'
import { localStorageService } from '@/services/storage/LocalStorageService'
import { getTodayDateString } from '@/utils/date'
import { calculateCurrentStreak } from '@/utils/streak'
import { generateDemoData } from '@/utils/demoGenerator'

const HABITS_STORAGE_KEY = 'habits'
const COMPLETIONS_STORAGE_KEY = 'completions'

export interface HabitStoreState {
  habits: Habit[]
  completions: Record<string, string[]> // habitId -> string[] of YYYY-MM-DD
  selectedDate: string
}

export const useHabitStore = defineStore('habit', {
  state: (): HabitStoreState => ({
    habits: [],
    completions: {},
    selectedDate: getTodayDateString()
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
    async initStore(storage: IStorageService = localStorageService): Promise<void> {
      const storedHabits = await storage.getItem<Habit[]>(HABITS_STORAGE_KEY)
      if (storedHabits && Array.isArray(storedHabits)) {
        this.habits = storedHabits
      }

      const storedCompletions =
        await storage.getItem<Record<string, string[]>>(COMPLETIONS_STORAGE_KEY)
      if (storedCompletions && typeof storedCompletions === 'object') {
        this.completions = storedCompletions
      }
    },

    async persist(storage: IStorageService = localStorageService): Promise<void> {
      await storage.setItem(HABITS_STORAGE_KEY, this.habits)
      await storage.setItem(COMPLETIONS_STORAGE_KEY, this.completions)
    },

    createHabit(
      payload: { name: string; emoji: string; color: string },
      storage: IStorageService = localStorageService
    ): Habit {
      const newHabit: Habit = {
        id:
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `habit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        name: payload.name.trim(),
        emoji: payload.emoji || '🎯',
        color: payload.color || '#4f46e5',
        createdAt: new Date().toISOString()
      }

      this.habits.push(newHabit)
      if (!this.completions[newHabit.id]) {
        this.completions[newHabit.id] = []
      }
      this.persist(storage)
      return newHabit
    },

    updateHabit(
      id: string,
      updates: Partial<Pick<Habit, 'name' | 'emoji' | 'color' | 'archived'>>,
      storage: IStorageService = localStorageService
    ): void {
      const index = this.habits.findIndex((h) => h.id === id)
      if (index !== -1) {
        const current = this.habits[index]
        if (current) {
          this.habits[index] = {
            ...current,
            ...updates,
            name: updates.name !== undefined ? updates.name.trim() : current.name
          }
          this.persist(storage)
        }
      }
    },

    deleteHabit(id: string, storage: IStorageService = localStorageService): void {
      this.habits = this.habits.filter((h) => h.id !== id)
      delete this.completions[id]
      this.persist(storage)
    },

    toggleCompletion(
      habitId: string,
      date: string = getTodayDateString(),
      storage: IStorageService = localStorageService
    ): boolean {
      if (!this.completions[habitId]) {
        this.completions[habitId] = []
      }

      const list = this.completions[habitId] || []
      const index = list.indexOf(date)
      let isNowCompleted = false

      if (index > -1) {
        list.splice(index, 1)
        isNowCompleted = false
      } else {
        list.push(date)
        isNowCompleted = true
      }

      this.persist(storage)
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

    /** Returns true when at least one demo habit is currently loaded. */
    hasDemoData(): boolean {
      return this.habits.some((h) => h.isDemo)
    },

    /**
     * Loads the 5 demo habits + 90-day history alongside real data.
     * Never overwrites or modifies habits/completions that are not flagged isDemo.
     */
    loadDemoData(storage: IStorageService = localStorageService): void {
      const { habits: demoHabits, completions: demoCompletions } = generateDemoData()

      for (const demoHabit of demoHabits) {
        // Skip if a demo habit with this id already exists (idempotent)
        if (!this.habits.find((h) => h.id === demoHabit.id)) {
          this.habits.push(demoHabit)
        }
        // Merge completions — never touch non-demo completion arrays
        if (!this.completions[demoHabit.id]) {
          this.completions[demoHabit.id] = demoCompletions[demoHabit.id] ?? []
        }
      }

      this.persist(storage)
    },

    /**
     * Removes all habits flagged with isDemo and their completion history.
     * Real habits and completions are untouched.
     */
    removeDemoData(storage: IStorageService = localStorageService): void {
      const demoIds = this.habits.filter((h) => h.isDemo).map((h) => h.id)

      this.habits = this.habits.filter((h) => !h.isDemo)
      for (const id of demoIds) {
        delete this.completions[id]
      }

      this.persist(storage)
    }
  }
})
