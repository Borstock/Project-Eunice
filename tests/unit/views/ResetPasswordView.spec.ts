import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import ResetPasswordView from '@/views/auth/ResetPasswordView.vue'
import { useAuthStore } from '@/stores/authStore'

describe('ResetPasswordView.vue', () => {
  let router: ReturnType<typeof createRouter>

  beforeEach(async () => {
    setActivePinia(createPinia())
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/reset-password', component: ResetPasswordView },
        { path: '/today', component: { template: '<div>Today View</div>' } }
      ]
    })
    await router.push('/reset-password')
    await router.isReady()
  })

  it('renders password inputs and submit button', () => {
    const wrapper = mount(ResetPasswordView, {
      global: { plugins: [router] }
    })

    expect(wrapper.find('input#newPassword').exists()).toBe(true)
    expect(wrapper.find('input#confirmPassword').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').text()).toContain('Update password')
  })

  it('validates password length and mismatch', async () => {
    const wrapper = mount(ResetPasswordView, {
      global: { plugins: [router] }
    })

    await wrapper.find('input#newPassword').setValue('123')
    await wrapper.find('input#confirmPassword').setValue('123')
    await wrapper.find('form').trigger('submit.prevent')
    expect(wrapper.text()).toContain('Password must be at least 6 characters')

    await wrapper.find('input#newPassword').setValue('123456')
    await wrapper.find('input#confirmPassword').setValue('abcdef')
    await wrapper.find('form').trigger('submit.prevent')
    expect(wrapper.text()).toContain('Passwords do not match')
  })

  it('updates password and displays success banner', async () => {
    const authStore = useAuthStore()
    vi.spyOn(authStore, 'updatePassword').mockResolvedValueOnce({ success: true })

    const wrapper = mount(ResetPasswordView, {
      global: { plugins: [router] }
    })

    await wrapper.find('input#newPassword').setValue('newSecurePassword123')
    await wrapper.find('input#confirmPassword').setValue('newSecurePassword123')
    await wrapper.find('form').trigger('submit.prevent')

    expect(authStore.updatePassword).toHaveBeenCalledWith('newSecurePassword123')
    expect(wrapper.text()).toContain('Password updated successfully')
  })
})
