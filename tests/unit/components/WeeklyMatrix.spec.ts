import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import WeeklyMatrix from '@/components/calendar/WeeklyMatrix.vue'
import { useHabitStore } from '@/stores/habitStore'
import { InMemoryStorageService } from '@/services/storage/InMemoryStorageService'
import { getTodayDateString } from '@/utils/date'

describe('WeeklyMatrix.vue', () => {
  let storage: InMemoryStorageService

  beforeEach(() => {
    setActivePinia(createPinia())
    storage = new InMemoryStorageService()
  })

  it('renders table headers and habit rows', () => {
    const store = useHabitStore()
    store.createHabit({ name: 'Reading', emoji: '📚', color: '#8b5cf6' }, storage)

    const wrapper = mount(WeeklyMatrix)
    expect(wrapper.text()).toContain('Reading')
    expect(wrapper.text()).toContain('7-Day Consistency Rate')
    expect(wrapper.findAll('tbody tr').length).toBe(1)
  })

  it('toggles completion date when button in cell is clicked', async () => {
    const store = useHabitStore()
    const habit = store.createHabit({ name: 'Exercise', emoji: '🏃', color: '#10b981' }, storage)
    const today = getTodayDateString()

    const wrapper = mount(WeeklyMatrix)
    const todayButton = wrapper.find(`button[title="Toggle Exercise for ${today}"]`)
    expect(todayButton.exists()).toBe(true)

    expect(store.isCompletedOnDate(habit.id, today)).toBe(false)
    await todayButton.trigger('click')
    expect(store.isCompletedOnDate(habit.id, today)).toBe(true)
  })
})
