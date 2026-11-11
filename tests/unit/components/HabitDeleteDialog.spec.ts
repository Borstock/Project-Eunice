import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import HabitDeleteDialog from '@/components/habit/HabitDeleteDialog.vue'

describe('HabitDeleteDialog.vue', () => {
  it('does not render when isOpen is false', () => {
    const wrapper = mount(HabitDeleteDialog, {
      props: { isOpen: false, habitName: 'Test' }
    })
    expect(wrapper.find('h3').exists()).toBe(false)
  })

  it('renders habit name and confirms deletion on click', async () => {
    const wrapper = mount(HabitDeleteDialog, {
      props: { isOpen: true, habitName: 'Meditation' }
    })

    expect(wrapper.text()).toContain('Delete Habit?')
    expect(wrapper.text()).toContain('Meditation')

    const buttons = wrapper.findAll('button')
    const deleteButton = buttons.find((b) => b.text().includes('Delete'))
    expect(deleteButton).toBeDefined()

    await deleteButton?.trigger('click')
    expect(wrapper.emitted('confirm')).toBeTruthy()
  })

  it('emits cancel when Cancel button is clicked', async () => {
    const wrapper = mount(HabitDeleteDialog, {
      props: { isOpen: true, habitName: 'Meditation' }
    })

    const buttons = wrapper.findAll('button')
    const cancelButton = buttons.find((b) => b.text().includes('Cancel'))
    await cancelButton?.trigger('click')

    expect(wrapper.emitted('cancel')).toBeTruthy()
  })
})
