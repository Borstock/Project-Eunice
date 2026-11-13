import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'
import StatsView from '@/views/StatsView.vue'
import { useHabitStore } from '@/stores/habitStore'
import { InMemoryStorageService } from '@/services/storage/InMemoryStorageService'

vi.mock('vue-chartjs', () => ({
  Bar: {
    name: 'Bar',
    props: ['data', 'options'],
    template: '<div data-testid="bar-chart" />',
  },
}))

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: { template: '<div />' } },
    { path: '/stats', component: { template: '<div />' } },
    { path: '/today', component: { template: '<div />' } },
    { path: '/settings', component: { template: '<div />' } },
  ],
})

function mountStats() {
  return mount(StatsView, {
    global: {
      plugins: [router],
    },
  })
}

describe('StatsView.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders empty state when there are no habits or no completions', () => {
    const wrapper = mountStats()

    expect(wrapper.text()).toContain('Statistics')
    expect(wrapper.text()).toContain('No habit history yet')
    expect(wrapper.text()).toContain('Load demo data')
  })

  it('clicking "Load demo data" in empty state populates habits and history', async () => {
    const store = useHabitStore()
    const wrapper = mountStats()

    const loadBtn = wrapper.find('button')
    expect(loadBtn.text()).toContain('Load demo data')

    await loadBtn.trigger('click')

    // Store now has demo data
    expect(store.habits.length).toBeGreaterThan(0)
    expect(wrapper.text()).toContain('30-Day Rate')
    expect(wrapper.text()).toContain('Habit Breakdown')
  })

  it('renders data state with summary cards, charts, and breakdown table', async () => {
    const store = useHabitStore()
    const storage = new InMemoryStorageService()
    store.loadDemoData(storage)

    const wrapper = mountStats()
    await wrapper.vm.$nextTick()

    // Title & Summary Cards
    expect(wrapper.text()).toContain('Statistics')
    expect(wrapper.text()).toContain('30-Day Rate')
    expect(wrapper.text()).toContain('Best Streak')
    expect(wrapper.text()).toContain('On Track (≥70%)')
    expect(wrapper.text()).toContain('Struggling (<50%)')

    // Charts
    const charts = wrapper.findAll('[data-testid="bar-chart"]')
    expect(charts.length).toBe(2)

    // Habit breakdown table
    expect(wrapper.text()).toContain('Habit Breakdown')
    expect(wrapper.text()).toContain('Morning Meditation')
    expect(wrapper.text()).toContain('Evening Run')

    // Accessible summary text
    expect(wrapper.find('[aria-label="Summary overview"]').exists()).toBe(true)
  })

  it('supports filtering by a specific habit', async () => {
    const store = useHabitStore()
    const storage = new InMemoryStorageService()
    store.loadDemoData(storage)

    const wrapper = mountStats()
    await wrapper.vm.$nextTick()

    const select = wrapper.find('select#habit-filter')
    expect(select.exists()).toBe(true)

    // Option for all and each demo habit
    const options = select.findAll('option')
    expect(options.length).toBe(6) // 1 'All' + 5 habits

    // Change filter to the first habit (Morning Meditation: demo-1)
    await select.setValue('demo-1')
    await wrapper.vm.$nextTick()

    // Accessible summary mentions selected habit
    expect(wrapper.text()).toContain('selected habit')
  })
})
