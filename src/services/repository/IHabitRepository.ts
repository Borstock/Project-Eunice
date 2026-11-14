import type { Habit } from '@/models/habit'

export interface IHabitRepository {
  /** Retrieves all habits from persistence. */
  getHabits(): Promise<Habit[]>

  /** Persists or inserts a habit. */
  saveHabit(habit: Habit): Promise<void>

  /** Updates mutable properties of an existing habit. */
  updateHabit(
    id: string,
    updates: Partial<Pick<Habit, 'name' | 'emoji' | 'color' | 'archived'>>
  ): Promise<void>

  /** Permanently deletes a habit and its completions. */
  deleteHabit(id: string): Promise<void>

  /** Retrieves all completions aggregated by habit ID. */
  getCompletions(): Promise<Record<string, string[]>>

  /** Sets a completion status for a specific habit on a given date (YYYY-MM-DD). */
  toggleCompletion(habitId: string, date: string, completed: boolean): Promise<void>

  /** Sets all completion dates for a specific habit (used for demo data & batch operations). */
  setCompletions(habitId: string, dates: string[]): Promise<void>

  /** Permanently clears all data for the current user/guest. */
  clearAll(): Promise<void>

  /** Deletes only records flagged as demo data. */
  deleteDemoData(): Promise<void>
}
