import type { Habit } from '@/models/habit'
import type { IHabitRepository } from './IHabitRepository'
import { getSupabase } from '@/services/supabase/client'
import type { IStorageService } from '@/services/storage/IStorageService'
import { localStorageService } from '@/services/storage/LocalStorageService'

const CLOUD_CACHE_HABITS = 'cloud_cached_habits'
const CLOUD_CACHE_COMPLETIONS = 'cloud_cached_completions'

export class SupabaseHabitRepository implements IHabitRepository {
  private cache: IStorageService

  constructor(cache: IStorageService = localStorageService) {
    this.cache = cache
  }

  private async getUserId(): Promise<string> {
    const supabase = getSupabase()
    const { data, error } = await supabase.auth.getUser()
    if (error || !data.user) {
      throw new Error('User is not authenticated with Supabase.')
    }
    return data.user.id
  }

  async getCachedHabits(): Promise<Habit[] | null> {
    return await this.cache.getItem<Habit[]>(CLOUD_CACHE_HABITS)
  }

  async getCachedCompletions(): Promise<Record<string, string[]> | null> {
    return await this.cache.getItem<Record<string, string[]>>(CLOUD_CACHE_COMPLETIONS)
  }

  async clearCache(): Promise<void> {
    await this.cache.removeItem(CLOUD_CACHE_HABITS)
    await this.cache.removeItem(CLOUD_CACHE_COMPLETIONS)
  }

  async getHabits(): Promise<Habit[]> {
    const supabase = getSupabase()
    const userId = await this.getUserId()

    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch habits from Supabase: ${error.message}`)
    }

    const habits: Habit[] = (data || []).map((row) => ({
      id: row.id,
      name: row.name,
      emoji: row.emoji,
      color: row.color,
      archived: Boolean(row.archived),
      isDemo: Boolean(row.is_demo),
      createdAt: row.created_at
    }))

    // Update local cache
    await this.cache.setItem(CLOUD_CACHE_HABITS, habits)
    return habits
  }

  async saveHabit(habit: Habit): Promise<void> {
    const supabase = getSupabase()
    const userId = await this.getUserId()

    const { error } = await supabase.from('habits').upsert(
      {
        id: habit.id,
        user_id: userId,
        name: habit.name,
        emoji: habit.emoji,
        color: habit.color,
        archived: Boolean(habit.archived),
        is_demo: Boolean(habit.isDemo),
        created_at: habit.createdAt
      },
      { onConflict: 'id' }
    )

    if (error) {
      throw new Error(`Failed to save habit to Supabase: ${error.message}`)
    }
  }

  async updateHabit(
    id: string,
    updates: Partial<Pick<Habit, 'name' | 'emoji' | 'color' | 'archived'>>
  ): Promise<void> {
    const supabase = getSupabase()
    const userId = await this.getUserId()

    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    }
    if (updates.name !== undefined) patch.name = updates.name.trim()
    if (updates.emoji !== undefined) patch.emoji = updates.emoji
    if (updates.color !== undefined) patch.color = updates.color
    if (updates.archived !== undefined) patch.archived = updates.archived

    const { error } = await supabase.from('habits').update(patch).match({ id, user_id: userId })

    if (error) {
      throw new Error(`Failed to update habit in Supabase: ${error.message}`)
    }
  }

  async deleteHabit(id: string): Promise<void> {
    const supabase = getSupabase()
    const userId = await this.getUserId()

    const { error } = await supabase.from('habits').delete().match({ id, user_id: userId })

    if (error) {
      throw new Error(`Failed to delete habit from Supabase: ${error.message}`)
    }
  }

  async getCompletions(): Promise<Record<string, string[]>> {
    const supabase = getSupabase()
    const userId = await this.getUserId()

    const { data, error } = await supabase
      .from('completions')
      .select('habit_id, date')
      .eq('user_id', userId)

    if (error) {
      throw new Error(`Failed to fetch completions from Supabase: ${error.message}`)
    }

    const completions: Record<string, string[]> = {}
    for (const row of data || []) {
      if (!completions[row.habit_id]) {
        completions[row.habit_id] = []
      }
      completions[row.habit_id]!.push(row.date)
    }

    // Update local cache
    await this.cache.setItem(CLOUD_CACHE_COMPLETIONS, completions)
    return completions
  }

  async toggleCompletion(habitId: string, date: string, completed: boolean): Promise<void> {
    const supabase = getSupabase()
    const userId = await this.getUserId()

    if (completed) {
      const { error } = await supabase.from('completions').upsert(
        {
          habit_id: habitId,
          user_id: userId,
          date,
          completed_at: new Date().toISOString()
        },
        { onConflict: 'habit_id,date' }
      )
      if (error) {
        throw new Error(`Failed to mark completion in Supabase: ${error.message}`)
      }
    } else {
      const { error } = await supabase
        .from('completions')
        .delete()
        .match({ habit_id: habitId, user_id: userId, date })

      if (error) {
        throw new Error(`Failed to delete completion in Supabase: ${error.message}`)
      }
    }
  }

  async setCompletions(habitId: string, dates: string[]): Promise<void> {
    const supabase = getSupabase()
    const userId = await this.getUserId()

    // Delete existing completions for this habit
    const { error: delError } = await supabase
      .from('completions')
      .delete()
      .match({ habit_id: habitId, user_id: userId })

    if (delError) {
      throw new Error(`Failed to reset completions in Supabase: ${delError.message}`)
    }

    if (dates.length > 0) {
      const rows = dates.map((date) => ({
        habit_id: habitId,
        user_id: userId,
        date,
        completed_at: new Date().toISOString()
      }))

      const { error: insError } = await supabase.from('completions').insert(rows)
      if (insError) {
        throw new Error(`Failed to insert completions in Supabase: ${insError.message}`)
      }
    }
  }

  async clearAll(): Promise<void> {
    const supabase = getSupabase()
    const userId = await this.getUserId()

    // Deleting habits cascades automatically to completions
    const { error } = await supabase.from('habits').delete().eq('user_id', userId)
    if (error) {
      throw new Error(`Failed to delete all cloud data: ${error.message}`)
    }

    await this.clearCache()
  }

  async deleteDemoData(): Promise<void> {
    const supabase = getSupabase()
    const userId = await this.getUserId()

    const { error } = await supabase
      .from('habits')
      .delete()
      .match({ user_id: userId, is_demo: true })

    if (error) {
      throw new Error(`Failed to delete demo data from Supabase: ${error.message}`)
    }
  }

  /**
   * Idempotently uploads local habits and completions to the user's account.
   * Excludes any habit flagged as demo data.
   */
  async uploadMigrationData(
    habits: Habit[],
    completions: Record<string, string[]>
  ): Promise<{ uploadedHabits: number; uploadedCompletions: number }> {
    const realHabits = habits.filter((h) => !h.isDemo)
    if (realHabits.length === 0) {
      return { uploadedHabits: 0, uploadedCompletions: 0 }
    }

    const supabase = getSupabase()
    const userId = await this.getUserId()

    const habitRows = realHabits.map((h) => ({
      id: h.id,
      user_id: userId,
      name: h.name,
      emoji: h.emoji,
      color: h.color,
      archived: Boolean(h.archived),
      is_demo: false,
      created_at: h.createdAt
    }))

    const { error: habitError } = await supabase
      .from('habits')
      .upsert(habitRows, { onConflict: 'id' })

    if (habitError) {
      throw new Error(`Migration habit upload failed: ${habitError.message}`)
    }

    const realHabitIds = new Set(realHabits.map((h) => h.id))
    const completionRows: Array<{
      habit_id: string
      user_id: string
      date: string
      completed_at: string
    }> = []

    for (const [habitId, dates] of Object.entries(completions)) {
      if (!realHabitIds.has(habitId) || !Array.isArray(dates)) continue
      for (const date of dates) {
        completionRows.push({
          habit_id: habitId,
          user_id: userId,
          date,
          completed_at: new Date().toISOString()
        })
      }
    }

    if (completionRows.length > 0) {
      const { error: compError } = await supabase
        .from('completions')
        .upsert(completionRows, { onConflict: 'habit_id,date' })

      if (compError) {
        throw new Error(`Migration completions upload failed: ${compError.message}`)
      }
    }

    return {
      uploadedHabits: habitRows.length,
      uploadedCompletions: completionRows.length
    }
  }
}

export const supabaseHabitRepository = new SupabaseHabitRepository()
