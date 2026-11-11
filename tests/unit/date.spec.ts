import { describe, it, expect } from 'vitest'
import {
  formatDateToIso,
  getTodayDateString,
  parseIsoDate,
  getPreviousDayString,
  getPastDates,
  getShortDayName,
  getDayNumber
} from '@/utils/date'

describe('Date utility functions', () => {
  it('formats dates into YYYY-MM-DD correctly', () => {
    const d = new Date(2026, 0, 5) // Jan 5, 2026
    expect(formatDateToIso(d)).toBe('2026-01-05')
  })

  it('returns valid YYYY-MM-DD string for today', () => {
    const today = getTodayDateString()
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('safely parses YYYY-MM-DD into a local Date', () => {
    const parsed = parseIsoDate('2026-08-15')
    expect(parsed.getFullYear()).toBe(2026)
    expect(parsed.getMonth()).toBe(7) // August is 7 (0-indexed)
    expect(parsed.getDate()).toBe(15)
  })

  it('calculates the previous day properly across month and year boundaries', () => {
    expect(getPreviousDayString('2026-03-01')).toBe('2026-02-28') // Non-leap year
    expect(getPreviousDayString('2026-01-01')).toBe('2025-12-31') // Year boundary
  })

  it('returns past N dates ending on the reference date', () => {
    const past3 = getPastDates(3, '2026-05-10')
    expect(past3).toEqual(['2026-05-08', '2026-05-09', '2026-05-10'])
  })

  it('extracts day name and day number', () => {
    expect(getDayNumber('2026-11-15')).toBe(15)
    const dayName = getShortDayName('2026-11-15', 'en-US')
    expect(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']).toContain(dayName)
  })
})
