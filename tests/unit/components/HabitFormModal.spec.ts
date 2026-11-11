import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import HabitFormModal from '@/components/habit/HabitFormModal.vue'

describe('HabitFormModal.vue', () => {
  it('does not render when isOpen is false', () => {
    const wrapper = mount(HabitFormModal, {
      props: { isOpen: false }
    })
    expect(wrapper.find('form').exists()).toBe(false)
  })

  it('renders form inputs when isOpen is true', () => {
    const wrapper = mount(HabitFormModal, {
      props: { isOpen: true }
    })
    expect(wrapper.find('input#habit-name').exists()).toBe(true)
  })

  it('validates empty name on submit', async () => {
    const wrapper = mount(HabitFormModal, {
      props: { isOpen: true }
    })
    await wrapper.find('form').trigger('submit.prevent')
    expect(wrapper.text()).toContain('Please enter a habit name')
    expect(wrapper.emitted('save')).toBeUndefined()
  })

  it('emits save event with input values when valid', async () => {
    const wrapper = mount(HabitFormModal, {
      props: { isOpen: true }
    })
    await wrapper.find('input#habit-name').setValue('Morning Walk')
    await wrapper.find('form').trigger('submit.prevent')

    expect(wrapper.emitted('save')).toBeTruthy()
    const payload = wrapper.emitted('save')?.[0]?.[0] as { name: string; emoji: string; color: string }
    expect(payload.name).toBe('Morning Walk')
    expect(payload.emoji).toBeDefined()
    expect(payload.color).toBeDefined()
  })

  it('prefills fields when habitToEdit prop is passed', () => {
    const habit = {
      id: 'h1',
      name: 'Yoga',
      emoji: '🧘',
      color: '#10b981',
      createdAt: '2026-01-01'
    }
    const wrapper = mount(HabitFormModal, {
      props: { isOpen: true, habitToEdit: habit }
    })

    const input = wrapper.find('input#habit-name').element as HTMLInputElement
    expect(input.value).toBe('Yoga')
    expect(wrapper.text()).toContain('Edit Habit')
  })
})
