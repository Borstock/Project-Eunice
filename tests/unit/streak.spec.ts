import { describe, it, expect } from 'vitest'
import { calculateCurrentStreak, calculateBestStreak } from '@/utils/streak'

describe('calculateCurrentStreak', () => {
  const TODAY = '2026-11-11'
  const YESTERDAY = '2026-11-10'
  const TWO_DAYS_AGO = '2026-11-09'
  const THREE_DAYS_AGO = '2026-11-08'
  const FOUR_DAYS_AGO = '2026-11-07'

  it('returns 0 when there are no completion records', () => {
    expect(calculateCurrentStreak([], TODAY)).toBe(0)
  })

  it('returns 1 when completed today only', () => {
    expect(calculateCurrentStreak([TODAY], TODAY)).toBe(1)
  })

  it('returns consecutive count when completed today and past consecutive days', () => {
    const dates = [TODAY, YESTERDAY, TWO_DAYS_AGO]
    expect(calculateCurrentStreak(dates, TODAY)).toBe(3)
  })

  it('preserves the streak if completed yesterday but not yet completed today', () => {
    const dates = [YESTERDAY, TWO_DAYS_AGO, THREE_DAYS_AGO]
    expect(calculateCurrentStreak(dates, TODAY)).toBe(3)
  })

  it('returns 0 if completed two days ago but missed yesterday and today', () => {
    const dates = [TWO_DAYS_AGO, THREE_DAYS_AGO]
    expect(calculateCurrentStreak(dates, TODAY)).toBe(0)
  })

  it('stops counting at the first broken gap in consecutive days', () => {
    // Has today and yesterday, missed two days ago, but completed four days ago
    const dates = [TODAY, YESTERDAY, FOUR_DAYS_AGO]
    expect(calculateCurrentStreak(dates, TODAY)).toBe(2)
  })

  it('handles unordered completion date arrays seamlessly', () => {
    const dates = [TWO_DAYS_AGO, TODAY, YESTERDAY]
    expect(calculateCurrentStreak(dates, TODAY)).toBe(3)
  })
})

describe('calculateBestStreak', () => {
  it('returns 0 for empty list', () => {
    expect(calculateBestStreak([])).toBe(0)
  })

  it('returns longest consecutive streak even if separated by gaps', () => {
    const dates = [
      '2026-01-01',
      '2026-01-02',
      '2026-01-03', // 3 days
      '2026-01-10',
      '2026-01-11',
      '2026-01-12',
      '2026-01-13',
      '2026-01-14' // 5 days
    ]
    expect(calculateBestStreak(dates)).toBe(5)
  })
})
