export interface Habit {
  id: string
  name: string
  emoji: string
  color: string
  createdAt: string
  archived?: boolean
  /** True for habits injected by the demo data generator — never set on real user habits. */
  isDemo?: boolean
}

export interface HabitCompletion {
  habitId: string
  date: string // YYYY-MM-DD
  completedAt: string // ISO 8601
}

export interface HabitWithStatus extends Habit {
  isCompletedToday: boolean
  currentStreak: number
}
