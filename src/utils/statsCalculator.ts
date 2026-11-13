/**
 * statsCalculator.ts
 *
 * Pure, framework-agnostic statistical calculations for Habit Tracker.
 * No Vue, no DOM dependencies.
 */

import type { Habit } from '@/models/habit'
import { getTodayDateString, getPastDates, parseIsoDate } from '@/utils/date'
import { calculateCurrentStreak, calculateBestStreak } from '@/utils/streak'

export interface HabitStats {
  habitId: string
  name: string
  emoji: string
  color: string
  isDemo?: boolean
  rate7: number
  rate30: number
  rate90: number
  currentStreak: number
  bestStreak: number
  totalCompletions: number
}

export interface PeriodCompletion {
  label: string
  completed: number
  missed: number
  total: number
  rate: number
}

export interface DayOfWeekStat {
  dayIndex: number // 0 = Monday, ... 6 = Sunday
  dayName: string // 'Mon', 'Tue', etc.
  completed: number
  total: number
  rate: number
}

export interface OverallSummary {
  totalHabits: number
  overallRate30: number
  overallRate90: number
  bestStreak: number
  habitsOnTrack: number
  habitsStruggling: number
  bestHabits: HabitStats[]
  worstHabits: HabitStats[]
}

/**
 * Calculates completion rate (0-100) for a single habit over the past N days.
 */
export function calculateHabitCompletionRate(
  completedDates: string[] | Set<string>,
  daysCount: number,
  referenceDate: string = getTodayDateString()
): number {
  if (daysCount <= 0) return 0
  const dateSet = completedDates instanceof Set ? completedDates : new Set(completedDates)
  const windowDates = getPastDates(daysCount, referenceDate)
  let completed = 0

  for (const date of windowDates) {
    if (dateSet.has(date)) {
      completed++
    }
  }

  return Math.round((completed / daysCount) * 100)
}

/**
 * Calculates complete statistics for an individual habit.
 */
export function calculateHabitStats(
  habit: Habit,
  completions: string[] = [],
  referenceDate: string = getTodayDateString()
): HabitStats {
  const completedSet = new Set(completions)

  return {
    habitId: habit.id,
    name: habit.name,
    emoji: habit.emoji,
    color: habit.color,
    isDemo: habit.isDemo,
    rate7: calculateHabitCompletionRate(completedSet, 7, referenceDate),
    rate30: calculateHabitCompletionRate(completedSet, 30, referenceDate),
    rate90: calculateHabitCompletionRate(completedSet, 90, referenceDate),
    currentStreak: calculateCurrentStreak(completedSet, referenceDate),
    bestStreak: calculateBestStreak(completions),
    totalCompletions: completions.length
  }
}

/**
 * Computes weekly completion data (completed vs missed) for the last N weeks (default 12).
 * Each week is a 7-day window.
 */
export function calculateWeeklyStats(
  habits: Habit[],
  completions: Record<string, string[]>,
  weekCount = 12,
  referenceDate: string = getTodayDateString()
): PeriodCompletion[] {
  if (habits.length === 0 || weekCount <= 0) return []

  const result: PeriodCompletion[] = []
  const totalDays = weekCount * 7
  const allDates = getPastDates(totalDays, referenceDate) // oldest to newest

  for (let w = 0; w < weekCount; w++) {
    const weekDates = allDates.slice(w * 7, (w + 1) * 7)
    const expected = weekDates.length * habits.length
    let completed = 0

    for (const d of weekDates) {
      for (const h of habits) {
        const list = completions[h.id]
        if (list && list.includes(d)) {
          completed++
        }
      }
    }

    const missed = Math.max(0, expected - completed)
    const rate = expected > 0 ? Math.round((completed / expected) * 100) : 0
    const startMonth = weekDates[0]?.slice(5) || `W${w + 1}`

    result.push({
      label: `W${w + 1} (${startMonth})`,
      completed,
      missed,
      total: expected,
      rate
    })
  }

  return result
}

/**
 * Computes monthly completion data (completed vs missed) for the last N months (default 6).
 */
export function calculateMonthlyStats(
  habits: Habit[],
  completions: Record<string, string[]>,
  monthCount = 6,
  referenceDate: string = getTodayDateString()
): PeriodCompletion[] {
  if (habits.length === 0 || monthCount <= 0) return []

  const refDate = parseIsoDate(referenceDate)
  const result: PeriodCompletion[] = []

  // Generate target months from oldest to current
  for (let m = monthCount - 1; m >= 0; m--) {
    const targetDate = new Date(refDate.getFullYear(), refDate.getMonth() - m, 1)
    const year = targetDate.getFullYear()
    const month = targetDate.getMonth()

    // Determine days in that month
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const isCurrentMonth = year === refDate.getFullYear() && month === refDate.getMonth()
    const daysToCount = isCurrentMonth ? refDate.getDate() : daysInMonth

    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`
    const expected = daysToCount * habits.length
    let completed = 0

    for (let day = 1; day <= daysToCount; day++) {
      const dateStr = `${monthPrefix}-${String(day).padStart(2, '0')}`
      for (const h of habits) {
        const list = completions[h.id]
        if (list && list.includes(dateStr)) {
          completed++
        }
      }
    }

    const missed = Math.max(0, expected - completed)
    const rate = expected > 0 ? Math.round((completed / expected) * 100) : 0
    const monthLabel = targetDate.toLocaleDateString('en-US', { month: 'short' })

    result.push({
      label: monthLabel,
      completed,
      missed,
      total: expected,
      rate
    })
  }

  return result
}

/**
 * Computes completion rate by day of the week (Monday through Sunday)
 * over the specified day window (default 90 days).
 */
export function calculateDayOfWeekStats(
  habits: Habit[],
  completions: Record<string, string[]>,
  daysWindow = 90,
  referenceDate: string = getTodayDateString()
): DayOfWeekStat[] {
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  // Map JS getDay(): 0 (Sun) -> 6, 1 (Mon) -> 0, etc.
  const toMondayFirst = (jsDay: number) => (jsDay === 0 ? 6 : jsDay - 1)

  const dayOccurrences = [0, 0, 0, 0, 0, 0, 0]
  const dayCompletions = [0, 0, 0, 0, 0, 0, 0]

  if (habits.length > 0 && daysWindow > 0) {
    const dates = getPastDates(daysWindow, referenceDate)

    for (const dateStr of dates) {
      const d = parseIsoDate(dateStr)
      const dayIdx = toMondayFirst(d.getDay())
      dayOccurrences[dayIdx]++

      for (const h of habits) {
        const list = completions[h.id]
        if (list && list.includes(dateStr)) {
          dayCompletions[dayIdx]++
        }
      }
    }
  }

  return dayNames.map((dayName, idx) => {
    const totalExpected = (dayOccurrences[idx] ?? 0) * habits.length
    const completed = dayCompletions[idx] ?? 0
    const rate = totalExpected > 0 ? Math.round((completed / totalExpected) * 100) : 0

    return {
      dayIndex: idx,
      dayName,
      completed,
      total: totalExpected,
      rate
    }
  })
}

/**
 * Computes an overall summary across all provided habits.
 */
export function calculateOverallSummary(
  habits: Habit[],
  completions: Record<string, string[]>,
  referenceDate: string = getTodayDateString()
): OverallSummary {
  if (habits.length === 0) {
    return {
      totalHabits: 0,
      overallRate30: 0,
      overallRate90: 0,
      bestStreak: 0,
      habitsOnTrack: 0,
      habitsStruggling: 0,
      bestHabits: [],
      worstHabits: []
    }
  }

  const habitStatsList = habits.map((h) =>
    calculateHabitStats(h, completions[h.id] || [], referenceDate)
  )

  const total30 = habitStatsList.reduce((acc, s) => acc + s.rate30, 0)
  const total90 = habitStatsList.reduce((acc, s) => acc + s.rate90, 0)
  const overallRate30 = Math.round(total30 / habitStatsList.length)
  const overallRate90 = Math.round(total90 / habitStatsList.length)
  const bestStreak = Math.max(0, ...habitStatsList.map((s) => s.bestStreak))

  const habitsOnTrack = habitStatsList.filter((s) => s.rate30 >= 70).length
  const habitsStruggling = habitStatsList.filter((s) => s.rate30 < 50).length

  const sortedByRate = [...habitStatsList].sort((a, b) => b.rate30 - a.rate30)
  const bestHabits = sortedByRate.slice(0, 3)
  const worstHabits = [...sortedByRate].reverse().slice(0, 3)

  return {
    totalHabits: habits.length,
    overallRate30,
    overallRate90,
    bestStreak,
    habitsOnTrack,
    habitsStruggling,
    bestHabits,
    worstHabits
  }
}
