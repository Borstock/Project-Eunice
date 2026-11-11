import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import HabitCard from '@/components/habit/HabitCard.vue'

describe('HabitCard.vue', () => {
  const mockHabit = {
    id: 'h1',
    name: 'Drink Water',
    emoji: '💧',
    color: '#06b6d4',
    createdAt: '2026-01-01'
  }

  it('renders habit details and streak', () => {
    const wrapper = mount(HabitCard, {
      props: {
        habit: mockHabit,
        isCompleted: false,
        streak: 3
      }
    })

    expect(wrapper.text()).toContain('Drink Water')
    expect(wrapper.text()).toContain('💧')
    expect(wrapper.text()).toContain('3 days')
  })

  it('emits toggle event when check button is clicked', async () => {
    const wrapper = mount(HabitCard, {
      props: {
        habit: mockHabit,
        isCompleted: false,
        streak: 0
      }
    })

    const button = wrapper.find('button')
    await button.trigger('click')
    expect(wrapper.emitted('toggle')).toBeTruthy()
  })

  it('applies strikethrough styling when isCompleted is true', () => {
    const wrapper = mount(HabitCard, {
      props: {
        habit: mockHabit,
        isCompleted: true,
        streak: 1
      }
    })

    const title = wrapper.find('h3')
    expect(title.classes()).toContain('line-through')
  })
})
