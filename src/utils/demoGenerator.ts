/**
 * demoGenerator.ts
 *
 * Pure, deterministic generator for demo habits and 90-day completion history.
 * Uses a seeded Linear Congruential Generator (LCG) — no external libraries.
 *
 * Five habit patterns:
 *   1. Almost perfect      (~95 % overall)
 *   2. Starts strong, fades (high early, near 0 at end)
 *   3. Weekday-only         (skips Sat/Sun ~90 % of the time)
 *   4. Irregular            (~50 % random)
 *   5. Steadily improving   (ramps from ~15 % to ~90 % over 90 days)
 */

import type { Habit } from '@/models/habit'
import { formatDateToIso } from '@/utils/date'

// ---------------------------------------------------------------------------
// Seeded LCG pseudo-random number generator
// ---------------------------------------------------------------------------

/** Returns a PRNG seeded with `seed` that produces floats in [0, 1). */
function makePrng(seed: number): () => number {
  // Numerical Recipes LCG constants
  let s = seed >>> 0 // ensure 32-bit unsigned
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0
    return s / 0x100000000
  }
}

// ---------------------------------------------------------------------------
// Demo habit definitions
// ---------------------------------------------------------------------------

export interface DemoHabit {
  id: string
  name: string
  emoji: string
  color: string
  pattern: 'perfect' | 'fading' | 'weekdays' | 'irregular' | 'improving'
}

export const DEMO_HABITS: DemoHabit[] = [
  { id: 'demo-1', name: 'Morning Meditation', emoji: '🧘', color: '#6366f1', pattern: 'perfect' },
  { id: 'demo-2', name: 'Evening Run', emoji: '🏃', color: '#f59e0b', pattern: 'fading' },
  { id: 'demo-3', name: 'Read 30 min', emoji: '📚', color: '#10b981', pattern: 'weekdays' },
  { id: 'demo-4', name: 'Drink 2 L Water', emoji: '💧', color: '#3b82f6', pattern: 'irregular' },
  { id: 'demo-5', name: 'Journaling', emoji: '✍️', color: '#ec4899', pattern: 'improving' }
]

// ---------------------------------------------------------------------------
// Generation
// ---------------------------------------------------------------------------

export interface GeneratedDemo {
  habits: Habit[]
  completions: Record<string, string[]> // habitId -> YYYY-MM-DD[]
}

/**
 * Generates 90 days of history ending on `endDate` (default: today).
 * Pass a fixed `endDate` in tests for determinism.
 */
export function generateDemoData(endDate?: Date): GeneratedDemo {
  const today = endDate ?? new Date()
  // Build the 90-day window (index 0 = oldest, index 89 = today)
  const dates: string[] = []
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    dates.push(formatDateToIso(d))
  }

  const habits: Habit[] = DEMO_HABITS.map((dh) => ({
    id: dh.id,
    name: dh.name,
    emoji: dh.emoji,
    color: dh.color,
    createdAt: dates[0] + 'T00:00:00.000Z',
    isDemo: true
  }))

  const completions: Record<string, string[]> = {}

  for (const dh of DEMO_HABITS) {
    // Each habit gets its own independent seed derived from its ID
    const seed = dh.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
    const rng = makePrng(seed)

    completions[dh.id] = dates.filter((dateStr, idx) => {
      const progress = idx / 89 // 0 at start, 1 at end

      switch (dh.pattern) {
        case 'perfect':
          // ~95 % completion — miss ~1 day in 20
          return rng() < 0.95

        case 'fading': {
          // Starts at ~95 %, drops to ~5 % by end (linear)
          const prob = 0.95 - 0.9 * progress
          return rng() < prob
        }

        case 'weekdays': {
          // Mon-Fri: ~90 % completion; Sat-Sun: ~10 %
          const dow = new Date(dateStr + 'T00:00:00').getDay() // 0=Sun,6=Sat
          const isWeekend = dow === 0 || dow === 6
          return rng() < (isWeekend ? 0.1 : 0.9)
        }

        case 'irregular':
          // ~50 % random
          return rng() < 0.5

        case 'improving': {
          // Starts at ~15 %, climbs to ~90 % (linear)
          const prob = 0.15 + 0.75 * progress
          return rng() < prob
        }
      }
    })
  }

  return { habits, completions }
}
