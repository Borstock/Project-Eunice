import { getPreviousDayString, getTodayDateString } from './date'

/**
 * Calculates current consecutive completion streak up to a given reference date (defaults to today)
 *
 * Algorithm:
 * - If completed today: count today + consecutive days immediately preceding today.
 * - If NOT completed today: check yesterday.
 *     - If completed yesterday: count consecutive days starting from yesterday (streak is preserved until today ends).
 *     - If NOT completed yesterday: streak is 0.
 */
export function calculateCurrentStreak(
  completedDates: string[] | Set<string>,
  referenceDate: string = getTodayDateString()
): number {
  const dateSet = completedDates instanceof Set ? completedDates : new Set(completedDates)

  if (dateSet.size === 0) {
    return 0
  }

  let streak = 0
  let checkDate = referenceDate

  if (dateSet.has(checkDate)) {
    // Completed today
    streak++
    checkDate = getPreviousDayString(checkDate)
    while (dateSet.has(checkDate)) {
      streak++
      checkDate = getPreviousDayString(checkDate)
    }
    return streak
  }

  // Not completed today, check yesterday
  const yesterday = getPreviousDayString(checkDate)
  if (dateSet.has(yesterday)) {
    streak++
    checkDate = getPreviousDayString(yesterday)
    while (dateSet.has(checkDate)) {
      streak++
      checkDate = getPreviousDayString(checkDate)
    }
    return streak
  }

  return 0
}

/**
 * Calculates the longest consecutive streak of all time from the completion dates
 */
export function calculateBestStreak(completedDates: string[]): number {
  if (completedDates.length === 0) {
    return 0
  }

  const sorted = Array.from(new Set(completedDates)).sort()
  let maxStreak = 1
  let currentStreak = 1

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]
    const curr = sorted[i]
    if (prev && curr && getPreviousDayString(curr) === prev) {
      currentStreak++
      if (currentStreak > maxStreak) {
        maxStreak = currentStreak
      }
    } else {
      currentStreak = 1
    }
  }

  return maxStreak
}
