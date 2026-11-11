import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import HabitsView from '@/views/HabitsView.vue'
import { useHabitStore } from '@/stores/habitStore'
import { InMemoryStorageService } from '@/services/storage/InMemoryStorageService'

describe('HabitsView.vue', () => {
  let storage: InMemoryStorageService

  beforeEach(() => {
    setActivePinia(createPinia())
    storage = new InMemoryStorageService()
  })

  it('renders empty state when there are no habits', () => {
    const wrapper = mount(HabitsView)
    expect(wrapper.text()).toContain('No habits yet')
    expect(wrapper.text()).toContain('Create your first habit')
  })

  it('renders list of habits when present', () => {
    const store = useHabitStore()
    store.createHabit({ name: 'Reading', emoji: '📚', color: '#8b5cf6' }, storage)

    const wrapper = mount(HabitsView)
    expect(wrapper.text()).toContain('Reading')
    expect(wrapper.text()).toContain('📚')
  })
})
