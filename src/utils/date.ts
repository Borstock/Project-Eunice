/**
 * Pads a number with a leading zero if < 10
 */
function pad(num: number): string {
  return num < 10 ? `0${num}` : `${num}`
}

/**
 * Formats a Date object to local YYYY-MM-DD string
 */
export function formatDateToIso(date: Date): string {
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  return `${year}-${month}-${day}`
}

/**
 * Returns today's date formatted as YYYY-MM-DD in local time
 */
export function getTodayDateString(): string {
  return formatDateToIso(new Date())
}

/**
 * Parses YYYY-MM-DD safely into a local Date object at midnight
 */
export function parseIsoDate(dateStr: string): Date {
  const parts = dateStr.split('-').map(Number)
  const year = parts[0] || 1970
  const month = (parts[1] || 1) - 1
  const day = parts[2] || 1
  return new Date(year, month, day, 0, 0, 0, 0)
}

/**
 * Returns the YYYY-MM-DD string for the day preceding the given date string
 */
export function getPreviousDayString(dateStr: string): string {
  const date = parseIsoDate(dateStr)
  date.setDate(date.getDate() - 1)
  return formatDateToIso(date)
}

/**
 * Returns an array of YYYY-MM-DD strings for the past N days ending with the given date
 */
export function getPastDates(count: number, endDateStr = getTodayDateString()): string[] {
  const dates: string[] = []
  const current = parseIsoDate(endDateStr)

  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(current)
    d.setDate(current.getDate() - i)
    dates.push(formatDateToIso(d))
  }
  return dates
}

/**
 * Returns short weekday abbreviation: "Mon", "Tue", etc.
 */
export function getShortDayName(dateStr: string, locale = 'en-US'): string {
  const date = parseIsoDate(dateStr)
  return date.toLocaleDateString(locale, { weekday: 'short' })
}

/**
 * Returns day number: 1, 2, ..., 31
 */
export function getDayNumber(dateStr: string): number {
  const date = parseIsoDate(dateStr)
  return date.getDate()
}

/**
 * Formats a date for header display (e.g., "Wednesday, November 11")
 */
export function formatFullDate(dateStr: string, locale = 'en-US'): string {
  const date = parseIsoDate(dateStr)
  return date.toLocaleDateString(locale, {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  })
}
