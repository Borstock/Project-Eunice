import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import WeeklyView from '@/views/WeeklyView.vue'
import { useHabitStore } from '@/stores/habitStore'
import { InMemoryStorageService } from '@/services/storage/InMemoryStorageService'

describe('WeeklyView.vue', () => {
  let storage: InMemoryStorageService

  beforeEach(() => {
    setActivePinia(createPinia())
    storage = new InMemoryStorageService()
  })

  it('renders empty state when there are no habits', () => {
    const wrapper = mount(WeeklyView, {
      global: {
        stubs: {
          RouterLink: {
            template: '<a><slot /></a>'
          }
        }
      }
    })
    expect(wrapper.text()).toContain('No habits to display')
    expect(wrapper.text()).toContain('Create Habits')
  })

  it('renders WeeklyMatrix component when habits exist', () => {
    const store = useHabitStore()
    store.createHabit({ name: 'Hydrate', emoji: '💧', color: '#06b6d4' }, storage)

    const wrapper = mount(WeeklyView, {
      global: {
        stubs: {
          RouterLink: {
            template: '<a><slot /></a>'
          },
          WeeklyMatrix: true
        }
      }
    })
    expect(wrapper.findComponent({ name: 'WeeklyMatrix' }).exists()).toBe(true)
  })
})
