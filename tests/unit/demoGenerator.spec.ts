import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { generateDemoData, DEMO_HABITS } from '@/utils/demoGenerator'
import { useHabitStore } from '@/stores/habitStore'
import { InMemoryStorageService } from '@/services/storage/InMemoryStorageService'
import { formatDateToIso } from '@/utils/date'

// Fixed anchor date for determinism — always the same regardless of when the tests run
const ANCHOR = new Date(2024, 0, 1) // 2024-01-01 (month is 0-indexed)

/** Returns YYYY-MM-DD for a Date using local time (matches the generator). */
function toLocal(d: Date): string {
  return formatDateToIso(d)
}

// ── Generator tests ──────────────────────────────────────────────────────────

describe('generateDemoData', () => {
  it('is deterministic — same output for same anchor date', () => {
    const a = generateDemoData(ANCHOR)
    const b = generateDemoData(ANCHOR)
    expect(a.habits).toEqual(b.habits)
    expect(a.completions).toEqual(b.completions)
  })

  it('produces exactly 5 habits all flagged isDemo', () => {
    const { habits } = generateDemoData(ANCHOR)
    expect(habits).toHaveLength(5)
    for (const h of habits) {
      expect(h.isDemo).toBe(true)
    }
  })

  it('produces at most 90 completion dates per habit, all non-empty', () => {
    const { completions } = generateDemoData(ANCHOR)
    for (const dh of DEMO_HABITS) {
      const days = completions[dh.id] ?? []
      expect(days.length).toBeLessThanOrEqual(90)
      expect(days.length).toBeGreaterThan(0)
    }
  })

  it('all completion dates are within the 90-day window (local time)', () => {
    const { completions } = generateDemoData(ANCHOR)

    const startDate = new Date(ANCHOR)
    startDate.setDate(ANCHOR.getDate() - 89)
    const startStr = toLocal(startDate)
    const endStr = toLocal(ANCHOR)

    for (const dh of DEMO_HABITS) {
      for (const d of completions[dh.id] ?? []) {
        expect(d >= startStr).toBe(true)
        expect(d <= endStr).toBe(true)
      }
    }
  })

  it('the "perfect" habit has ≥ 85 % completion rate', () => {
    const { completions } = generateDemoData(ANCHOR)
    const days = completions['demo-1'] ?? []
    expect(days.length / 90).toBeGreaterThanOrEqual(0.85)
  })

  it('the "fading" habit has lower completion in the second half than first', () => {
    const { completions } = generateDemoData(ANCHOR)
    const days = completions['demo-2'] ?? []

    // Build the full 90-day array in local time
    const dates: string[] = []
    for (let i = 89; i >= 0; i--) {
      const d = new Date(ANCHOR)
      d.setDate(ANCHOR.getDate() - i)
      dates.push(toLocal(d))
    }
    const daySet = new Set(days)
    const firstHalf = dates.slice(0, 45).filter((d) => daySet.has(d)).length
    const secondHalf = dates.slice(45).filter((d) => daySet.has(d)).length

    expect(firstHalf).toBeGreaterThan(secondHalf)
  })

  it('the "weekdays" habit has a clearly lower weekend completion rate', () => {
    const { completions } = generateDemoData(ANCHOR)
    const daySet = new Set(completions['demo-3'] ?? [])

    let weekdayCompleted = 0,
      weekdayTotal = 0
    let weekendCompleted = 0,
      weekendTotal = 0

    for (let i = 89; i >= 0; i--) {
      const d = new Date(ANCHOR)
      d.setDate(ANCHOR.getDate() - i)
      const str = toLocal(d)
      const dow = d.getDay() // 0=Sun, 6=Sat
      const isWeekend = dow === 0 || dow === 6
      if (isWeekend) {
        weekendTotal++
        if (daySet.has(str)) weekendCompleted++
      } else {
        weekdayTotal++
        if (daySet.has(str)) weekdayCompleted++
      }
    }

    const weekdayRate = weekdayCompleted / weekdayTotal
    const weekendRate = weekendCompleted / weekendTotal
    // Weekday rate must be clearly higher — allow looser margin given sample size
    expect(weekdayRate).toBeGreaterThan(weekendRate)
    // Additionally verify weekend rate is below 30 %
    expect(weekendRate).toBeLessThan(0.3)
  })

  it('the "improving" habit has higher completion in the second half', () => {
    const { completions } = generateDemoData(ANCHOR)
    const days = completions['demo-5'] ?? []

    const dates: string[] = []
    for (let i = 89; i >= 0; i--) {
      const d = new Date(ANCHOR)
      d.setDate(ANCHOR.getDate() - i)
      dates.push(toLocal(d))
    }
    const daySet = new Set(days)
    const firstHalf = dates.slice(0, 45).filter((d) => daySet.has(d)).length
    const secondHalf = dates.slice(45).filter((d) => daySet.has(d)).length

    expect(secondHalf).toBeGreaterThan(firstHalf)
  })

  it('the "irregular" habit has ~50 % completion rate (25–75 % range)', () => {
    const { completions } = generateDemoData(ANCHOR)
    const rate = (completions['demo-4'] ?? []).length / 90
    expect(rate).toBeGreaterThan(0.25)
    expect(rate).toBeLessThan(0.75)
  })
})

// ── Store action tests ───────────────────────────────────────────────────────

describe('habitStore demo actions', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('loadDemoData adds 5 demo habits without touching real habits', () => {
    const store = useHabitStore()
    const storage = new InMemoryStorageService()

    store.createHabit({ name: 'Real Habit', emoji: '🌟', color: '#000' }, storage)
    expect(store.habits).toHaveLength(1)

    store.loadDemoData(storage)

    expect(store.habits).toHaveLength(6)
    expect(store.habits.filter((h) => h.isDemo)).toHaveLength(5)
    expect(store.habits.filter((h) => !h.isDemo)).toHaveLength(1)
    expect(store.habits.find((h) => !h.isDemo)?.name).toBe('Real Habit')
  })

  it('loadDemoData is idempotent — calling twice does not duplicate demo habits', () => {
    const store = useHabitStore()
    const storage = new InMemoryStorageService()

    store.loadDemoData(storage)
    store.loadDemoData(storage)

    expect(store.habits.filter((h) => h.isDemo)).toHaveLength(5)
  })

  it('removeDemoData deletes only demo habits and their completions', () => {
    const store = useHabitStore()
    const storage = new InMemoryStorageService()

    store.createHabit({ name: 'Real Habit', emoji: '🌟', color: '#000' }, storage)
    store.loadDemoData(storage)
    expect(store.habits).toHaveLength(6)

    store.removeDemoData(storage)

    expect(store.habits).toHaveLength(1)
    expect(store.habits[0]?.name).toBe('Real Habit')

    for (const dh of DEMO_HABITS) {
      expect(store.completions[dh.id]).toBeUndefined()
    }
  })

  it('removeDemoData on a store with no demo data is a no-op', () => {
    const store = useHabitStore()
    const storage = new InMemoryStorageService()

    store.createHabit({ name: 'Real Habit', emoji: '🌟', color: '#000' }, storage)
    store.removeDemoData(storage)

    expect(store.habits).toHaveLength(1)
  })

  it('hasDemoData returns false before loading and true after', () => {
    const store = useHabitStore()
    const storage = new InMemoryStorageService()

    expect(store.hasDemoData()).toBe(false)
    store.loadDemoData(storage)
    expect(store.hasDemoData()).toBe(true)
    store.removeDemoData(storage)
    expect(store.hasDemoData()).toBe(false)
  })

  it('real habit completions are preserved after removeDemoData', () => {
    const store = useHabitStore()
    const storage = new InMemoryStorageService()

    const real = store.createHabit({ name: 'Real', emoji: '🌟', color: '#000' }, storage)
    store.toggleCompletion(real.id, '2024-01-01', storage)

    store.loadDemoData(storage)
    store.removeDemoData(storage)

    expect(store.completions[real.id]).toContain('2024-01-01')
  })
})
