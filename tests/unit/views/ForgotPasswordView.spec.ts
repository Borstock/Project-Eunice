import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import ForgotPasswordView from '@/views/auth/ForgotPasswordView.vue'
import { useAuthStore } from '@/stores/authStore'

describe('ForgotPasswordView.vue', () => {
  let router: ReturnType<typeof createRouter>

  beforeEach(async () => {
    setActivePinia(createPinia())
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/forgot-password', component: ForgotPasswordView },
        { path: '/login', component: { template: '<div>Login View</div>' } },
        { path: '/today', component: { template: '<div>Today View</div>' } }
      ]
    })
    await router.push('/forgot-password')
    await router.isReady()
  })

  it('renders email input and submit button', () => {
    const wrapper = mount(ForgotPasswordView, {
      global: { plugins: [router] }
    })

    expect(wrapper.find('input#email').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').text()).toContain('Send reset link')
  })

  it('validates empty email', async () => {
    const wrapper = mount(ForgotPasswordView, {
      global: { plugins: [router] }
    })

    await wrapper.find('form').trigger('submit.prevent')
    expect(wrapper.text()).toContain('Please enter your email address')
  })

  it('displays confirmation when reset link is sent successfully', async () => {
    const authStore = useAuthStore()
    vi.spyOn(authStore, 'resetPasswordForEmail').mockResolvedValueOnce({ success: true })

    const wrapper = mount(ForgotPasswordView, {
      global: { plugins: [router] }
    })

    await wrapper.find('input#email').setValue('user@example.com')
    await wrapper.find('form').trigger('submit.prevent')

    expect(authStore.resetPasswordForEmail).toHaveBeenCalledWith('user@example.com')
    expect(wrapper.text()).toContain('Reset link sent')
    expect(wrapper.text()).toContain('user@example.com')
  })
})
