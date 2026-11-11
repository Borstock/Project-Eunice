import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StreakBadge from '@/components/habit/StreakBadge.vue'

describe('StreakBadge.vue', () => {
  it('renders "0 days" when streak is 0', () => {
    const wrapper = mount(StreakBadge, {
      props: { streak: 0 }
    })
    expect(wrapper.text()).toContain('0 days')
    expect(wrapper.text()).not.toContain('🔥')
  })

  it('renders "1 day" and flame icon when streak is 1', () => {
    const wrapper = mount(StreakBadge, {
      props: { streak: 1 }
    })
    expect(wrapper.text()).toContain('1 day')
    expect(wrapper.text()).toContain('🔥')
  })

  it('renders "5 days" when streak is 5', () => {
    const wrapper = mount(StreakBadge, {
      props: { streak: 5 }
    })
    expect(wrapper.text()).toContain('5 days')
    expect(wrapper.text()).toContain('🔥')
  })
})
