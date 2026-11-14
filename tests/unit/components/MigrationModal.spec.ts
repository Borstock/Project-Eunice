import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import MigrationModal from '@/components/common/MigrationModal.vue'
import { useHabitStore } from '@/stores/habitStore'
import type { Habit } from '@/models/habit'

describe('MigrationModal.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders nothing when migrationPromptOpen is false', () => {
    const habitStore = useHabitStore()
    habitStore.migrationPromptOpen = false

    const wrapper = mount(MigrationModal)
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })

  it('renders modal with habit and completion counts when open', () => {
    const habitStore = useHabitStore()
    habitStore.migrationPromptOpen = true
    habitStore.localMigrationCandidate = {
      habits: [{ id: '1', name: 'Habit 1' } as Habit, { id: '2', name: 'Habit 2' } as Habit],
      completionsCount: 14
    }

    const wrapper = mount(MigrationModal)
    expect(document.body.textContent).toContain('Migrate your local habits')
    expect(document.body.textContent).toContain('Local habits found:')
    expect(document.body.textContent).toContain('2')
    expect(document.body.textContent).toContain('14')
    expect(document.body.textContent).toContain('Upload to my account')
    expect(document.body.textContent).toContain('Start empty')
    wrapper.unmount()
  })

  it('calls executeMigration when "Upload to my account" is clicked', async () => {
    const habitStore = useHabitStore()
    habitStore.migrationPromptOpen = true
    habitStore.localMigrationCandidate = {
      habits: [{ id: '1', name: 'Habit 1' } as Habit],
      completionsCount: 5
    }

    const migrateSpy = vi.spyOn(habitStore, 'executeMigration').mockResolvedValueOnce()

    const wrapper = mount(MigrationModal)
    const uploadBtn = Array.from(document.body.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Upload to my account')
    )
    expect(uploadBtn).toBeDefined()
    uploadBtn?.click()
    await wrapper.vm.$nextTick()

    expect(migrateSpy).toHaveBeenCalled()
    wrapper.unmount()
  })

  it('displays error message if migration fails', async () => {
    const habitStore = useHabitStore()
    habitStore.migrationPromptOpen = true
    habitStore.localMigrationCandidate = {
      habits: [{ id: '1', name: 'Habit 1' } as Habit],
      completionsCount: 5
    }

    vi.spyOn(habitStore, 'executeMigration').mockRejectedValueOnce(
      new Error('Upload network failure')
    )

    const wrapper = mount(MigrationModal)
    const uploadBtn = Array.from(document.body.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Upload to my account')
    )
    uploadBtn?.click()
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(document.body.textContent).toContain('Upload network failure')
    wrapper.unmount()
  })

  it('calls dismissMigration when "Start empty" is clicked', async () => {
    const habitStore = useHabitStore()
    habitStore.migrationPromptOpen = true
    habitStore.localMigrationCandidate = {
      habits: [{ id: '1', name: 'Habit 1' } as Habit],
      completionsCount: 5
    }

    const dismissSpy = vi.spyOn(habitStore, 'dismissMigration')

    const wrapper = mount(MigrationModal)
    const startEmptyBtn = Array.from(document.body.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Start empty')
    )
    expect(startEmptyBtn).toBeDefined()
    startEmptyBtn?.click()
    await wrapper.vm.$nextTick()

    expect(dismissSpy).toHaveBeenCalledWith(true)
    wrapper.unmount()
  })
})
