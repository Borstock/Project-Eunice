import { describe, it, expect } from 'vitest'
import {
  calculateHabitCompletionRate,
  calculateHabitStats,
  calculateWeeklyStats,
  calculateMonthlyStats,
  calculateDayOfWeekStats,
  calculateOverallSummary,
} from '@/utils/statsCalculator'
import type { Habit } from '@/models/habit'
import { getPastDates } from '@/utils/date'

const ANCHOR = '2026-11-13'

const mockHabits: Habit[] = [
  {
    id: 'h1',
    name: 'Morning Meditation',
    emoji: '🧘',
    color: '#6366f1',
    createdAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'h2',
    name: 'Evening Run',
    emoji: '🏃',
    color: '#f59e0b',
    createdAt: '2026-08-01T00:00:00.000Z',
  },
]

describe('statsCalculator', () => {
  describe('calculateHabitCompletionRate', () => {
    it('returns 0 for empty completions or 0 daysCount', () => {
      expect(calculateHabitCompletionRate([], 7, ANCHOR)).toBe(0)
      expect(calculateHabitCompletionRate(['2026-11-13'], 0, ANCHOR)).toBe(0)
    })

    it('calculates accurate rate for last 7, 30, 90 days', () => {
      // 5 completions in last 7 days
      const last7Dates = getPastDates(7, ANCHOR)
      const completions = last7Dates.slice(0, 5) // 5 out of 7 = 71%

      expect(calculateHabitCompletionRate(completions, 7, ANCHOR)).toBe(71)
      // 5 out of 30 = 17%
      expect(calculateHabitCompletionRate(completions, 30, ANCHOR)).toBe(17)
      // 5 out of 90 = 6%
      expect(calculateHabitCompletionRate(completions, 90, ANCHOR)).toBe(6)
    })

    it('ignores completions outside the requested window', () => {
      const completions = ['2025-01-01', '2025-02-01']
      expect(calculateHabitCompletionRate(completions, 30, ANCHOR)).toBe(0)
    })
  })

  describe('calculateHabitStats', () => {
    it('calculates rate7, rate30, rate90, current streak, best streak', () => {
      // Completed last 3 consecutive days ending today
      const past3 = getPastDates(3, ANCHOR)
      // Plus an older 5-day streak
      const olderStreak = ['2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-05']
      const completions = [...olderStreak, ...past3]

      const stats = calculateHabitStats(mockHabits[0]!, completions, ANCHOR)

      expect(stats.habitId).toBe('h1')
      expect(stats.name).toBe('Morning Meditation')
      expect(stats.currentStreak).toBe(3)
      expect(stats.bestStreak).toBe(5)
      expect(stats.totalCompletions).toBe(8)
      expect(stats.rate7).toBe(Math.round((3 / 7) * 100))
    })
  })

  describe('calculateWeeklyStats', () => {
    it('returns empty array when habits list is empty', () => {
      expect(calculateWeeklyStats([], {}, 12, ANCHOR)).toEqual([])
    })

    it('returns 12 weeks of completed vs missed stats', () => {
      // 12 weeks of 7 days = 84 days total
      const all84 = getPastDates(84, ANCHOR)
      // habit 1 completes every day in the most recent week
      const lastWeek = all84.slice(all84.length - 7)
      const completions = {
        h1: lastWeek,
      }

      const weekly = calculateWeeklyStats([mockHabits[0]!], completions, 12, ANCHOR)

      expect(weekly).toHaveLength(12)
      // The last week (W12) should have 7 completed, 0 missed
      const latestWeek = weekly[11]!
      expect(latestWeek.completed).toBe(7)
      expect(latestWeek.missed).toBe(0)
      expect(latestWeek.total).toBe(7)
      expect(latestWeek.rate).toBe(100)

      // An older week should have 0 completed, 7 missed
      const firstWeek = weekly[0]!
      expect(firstWeek.completed).toBe(0)
      expect(firstWeek.missed).toBe(7)
      expect(firstWeek.rate).toBe(0)
    })
  })

  describe('calculateMonthlyStats', () => {
    it('returns monthly stats for the last N months', () => {
      const completions = {
        h1: ['2026-11-10', '2026-11-11', '2026-11-12'],
      }

      const monthly = calculateMonthlyStats([mockHabits[0]!], completions, 3, ANCHOR)

      expect(monthly).toHaveLength(3)
      // Current month (Nov)
      const currentMonth = monthly[2]!
      expect(currentMonth.label).toBe('Nov')
      expect(currentMonth.completed).toBe(3)
    })
  })

  describe('calculateDayOfWeekStats', () => {
    it('returns 7 days of the week starting from Monday', () => {
      const days = calculateDayOfWeekStats([mockHabits[0]!], {}, 90, ANCHOR)

      expect(days).toHaveLength(7)
      expect(days.map((d) => d.dayName)).toEqual([
        'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'
      ])
    })

    it('aggregates completions on corresponding weekdays', () => {
      // Anchor '2026-11-13' is Friday.
      // 2026-11-13 is Friday
      const completions = {
        h1: ['2026-11-13'],
      }

      const days = calculateDayOfWeekStats([mockHabits[0]!], completions, 7, ANCHOR)
      const friday = days.find((d) => d.dayName === 'Fri')

      expect(friday).toBeDefined()
      expect(friday?.completed).toBe(1)
      expect(friday?.rate).toBeGreaterThan(0)
    })
  })

  describe('calculateOverallSummary', () => {
    it('handles empty habits gracefully', () => {
      const summary = calculateOverallSummary([], {}, ANCHOR)

      expect(summary.totalHabits).toBe(0)
      expect(summary.overallRate30).toBe(0)
      expect(summary.bestStreak).toBe(0)
      expect(summary.habitsOnTrack).toBe(0)
      expect(summary.habitsStruggling).toBe(0)
      expect(summary.bestHabits).toEqual([])
      expect(summary.worstHabits).toEqual([])
    })

    it('summarizes rates, streaks, and ranks best/worst habits', () => {
      // h1 completed 25 out of 30 days (~83% -> on track)
      const past30 = getPastDates(30, ANCHOR)
      const h1Completions = past30.slice(0, 25)
      // h2 completed 5 out of 30 days (~17% -> struggling)
      const h2Completions = past30.slice(0, 5)

      const completions = {
        h1: h1Completions,
        h2: h2Completions,
      }

      const summary = calculateOverallSummary(mockHabits, completions, ANCHOR)

      expect(summary.totalHabits).toBe(2)
      expect(summary.habitsOnTrack).toBe(1)
      expect(summary.habitsStruggling).toBe(1)
      expect(summary.bestHabits[0]?.habitId).toBe('h1')
      expect(summary.worstHabits[0]?.habitId).toBe('h2')
    })
  })
})
