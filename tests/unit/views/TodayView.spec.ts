import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import TodayView from '@/views/TodayView.vue'
import { useHabitStore } from '@/stores/habitStore'
import { InMemoryStorageService } from '@/services/storage/InMemoryStorageService'
import { getTodayDateString } from '@/utils/date'

describe('TodayView.vue', () => {
  let storage: InMemoryStorageService

  beforeEach(() => {
    setActivePinia(createPinia())
    storage = new InMemoryStorageService()
  })

  it('renders empty state when there are no habits', () => {
    const wrapper = mount(TodayView)
    expect(wrapper.text()).toContain('Start Your First Habit')
    expect(wrapper.text()).toContain('+ Add First Habit')
  })

  it('renders habits list with progress when habits exist', () => {
    const store = useHabitStore()
    store.createHabit({ name: 'Workout', emoji: '🏋️', color: '#ef4444' }, storage)

    const wrapper = mount(TodayView)
    expect(wrapper.text()).toContain('Workout')
    expect(wrapper.text()).toContain('0 of 1 habits completed')
    expect(wrapper.text()).toContain('0%')
  })

  it('shows celebration message when all habits are completed', () => {
    const store = useHabitStore()
    const habit = store.createHabit({ name: 'Meditation', emoji: '🧘', color: '#10b981' }, storage)
    store.toggleCompletion(habit.id, getTodayDateString(), storage)

    const wrapper = mount(TodayView)
    expect(wrapper.text()).toContain('All habits completed today!')
    expect(wrapper.text()).toContain('100%')
  })
})
