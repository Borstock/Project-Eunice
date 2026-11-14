import type { Habit } from '@/models/habit'
import type { IHabitRepository } from './IHabitRepository'
import type { IStorageService } from '@/services/storage/IStorageService'
import { localStorageService } from '@/services/storage/LocalStorageService'

const HABITS_KEY = 'habits'
const COMPLETIONS_KEY = 'completions'

export class LocalHabitRepository implements IHabitRepository {
  private storage: IStorageService

  constructor(storage: IStorageService = localStorageService) {
    this.storage = storage
  }

  async getHabits(): Promise<Habit[]> {
    const data = this.storage.getItem<Habit[]>(HABITS_KEY)
    if (data instanceof Promise) {
      const resolved = await data
      return Array.isArray(resolved) ? resolved : []
    }
    return Array.isArray(data) ? data : []
  }

  async saveHabit(habit: Habit): Promise<void> {
    const raw = this.storage.getItem<Habit[]>(HABITS_KEY)
    if (raw instanceof Promise) {
      const habits = (await raw) || []
      const index = habits.findIndex((h) => h.id === habit.id)
      if (index >= 0) {
        habits[index] = habit
      } else {
        habits.push(habit)
      }
      await this.storage.setItem(HABITS_KEY, habits)
      return
    }

    const habits = Array.isArray(raw) ? [...raw] : []
    const index = habits.findIndex((h) => h.id === habit.id)
    if (index >= 0) {
      habits[index] = habit
    } else {
      habits.push(habit)
    }
    const setResult = this.storage.setItem(HABITS_KEY, habits)
    if (setResult instanceof Promise) {
      await setResult
    }
  }

  async updateHabit(
    id: string,
    updates: Partial<Pick<Habit, 'name' | 'emoji' | 'color' | 'archived'>>
  ): Promise<void> {
    const raw = this.storage.getItem<Habit[]>(HABITS_KEY)
    if (raw instanceof Promise) {
      const habits = (await raw) || []
      const index = habits.findIndex((h) => h.id === id)
      if (index >= 0 && habits[index]) {
        const current = habits[index]!
        habits[index] = {
          ...current,
          ...updates,
          name: updates.name !== undefined ? updates.name.trim() : current.name
        }
        await this.storage.setItem(HABITS_KEY, habits)
      }
      return
    }

    const habits = Array.isArray(raw) ? [...raw] : []
    const index = habits.findIndex((h) => h.id === id)
    if (index >= 0 && habits[index]) {
      const current = habits[index]!
      habits[index] = {
        ...current,
        ...updates,
        name: updates.name !== undefined ? updates.name.trim() : current.name
      }
      const setResult = this.storage.setItem(HABITS_KEY, habits)
      if (setResult instanceof Promise) {
        await setResult
      }
    }
  }

  async deleteHabit(id: string): Promise<void> {
    const rawHabits = this.storage.getItem<Habit[]>(HABITS_KEY)
    const rawCompletions = this.storage.getItem<Record<string, string[]>>(COMPLETIONS_KEY)

    if (rawHabits instanceof Promise || rawCompletions instanceof Promise) {
      const habits = (await rawHabits) || []
      const filtered = habits.filter((h) => h.id !== id)
      await this.storage.setItem(HABITS_KEY, filtered)

      const completions = (await rawCompletions) || {}
      if (completions[id]) {
        delete completions[id]
        await this.storage.setItem(COMPLETIONS_KEY, completions)
      }
      return
    }

    const habits = Array.isArray(rawHabits) ? rawHabits : []
    const filtered = habits.filter((h) => h.id !== id)
    const setH = this.storage.setItem(HABITS_KEY, filtered)

    const completions =
      rawCompletions && typeof rawCompletions === 'object' ? { ...rawCompletions } : {}
    if (completions[id]) {
      delete completions[id]
      const setC = this.storage.setItem(COMPLETIONS_KEY, completions)
      if (setC instanceof Promise) await setC
    }
    if (setH instanceof Promise) await setH
  }

  async getCompletions(): Promise<Record<string, string[]>> {
    const data = this.storage.getItem<Record<string, string[]>>(COMPLETIONS_KEY)
    if (data instanceof Promise) {
      const resolved = await data
      return resolved && typeof resolved === 'object' ? resolved : {}
    }
    return data && typeof data === 'object' ? data : {}
  }

  async toggleCompletion(habitId: string, date: string, completed: boolean): Promise<void> {
    const raw = this.storage.getItem<Record<string, string[]>>(COMPLETIONS_KEY)
    if (raw instanceof Promise) {
      const completions = (await raw) || {}
      const list = completions[habitId] ? [...completions[habitId]!] : []
      const index = list.indexOf(date)
      if (completed && index === -1) {
        list.push(date)
      } else if (!completed && index > -1) {
        list.splice(index, 1)
      }
      completions[habitId] = list
      await this.storage.setItem(COMPLETIONS_KEY, completions)
      return
    }

    const completions = raw && typeof raw === 'object' ? { ...raw } : {}
    const list = completions[habitId] ? [...completions[habitId]!] : []
    const index = list.indexOf(date)
    if (completed && index === -1) {
      list.push(date)
    } else if (!completed && index > -1) {
      list.splice(index, 1)
    }
    completions[habitId] = list
    const setResult = this.storage.setItem(COMPLETIONS_KEY, completions)
    if (setResult instanceof Promise) {
      await setResult
    }
  }

  async setCompletions(habitId: string, dates: string[]): Promise<void> {
    const completions = await this.getCompletions()
    completions[habitId] = dates
    await this.storage.setItem(COMPLETIONS_KEY, completions)
  }

  async clearAll(): Promise<void> {
    await this.storage.removeItem(HABITS_KEY)
    await this.storage.removeItem(COMPLETIONS_KEY)
  }

  async deleteDemoData(): Promise<void> {
    const habits = await this.getHabits()
    const demoIds = habits.filter((h) => h.isDemo).map((h) => h.id)
    const remaining = habits.filter((h) => !h.isDemo)
    await this.storage.setItem(HABITS_KEY, remaining)

    const completions = await this.getCompletions()
    demoIds.forEach((id) => delete completions[id])
    await this.storage.setItem(COMPLETIONS_KEY, completions)
  }
}

export const localHabitRepository = new LocalHabitRepository()
