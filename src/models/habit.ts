export interface Habit {
  id: string
  name: string
  emoji: string
  color: string
  createdAt: string
  archived?: boolean
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
