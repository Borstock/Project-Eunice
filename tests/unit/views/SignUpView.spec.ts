import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import SignUpView from '@/views/auth/SignUpView.vue'
import { useAuthStore } from '@/stores/authStore'
import { useHabitStore } from '@/stores/habitStore'

describe('SignUpView.vue', () => {
  let router: ReturnType<typeof createRouter>

  beforeEach(async () => {
    setActivePinia(createPinia())
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/signup', component: SignUpView },
        { path: '/today', component: { template: '<div>Today View</div>' } },
        { path: '/login', component: { template: '<div>Login View</div>' } }
      ]
    })
    await router.push('/signup')
    await router.isReady()
  })

  it('renders sign up form elements', () => {
    const wrapper = mount(SignUpView, {
      global: { plugins: [router] }
    })

    expect(wrapper.find('input#email').exists()).toBe(true)
    expect(wrapper.find('input#password').exists()).toBe(true)
    expect(wrapper.find('input#confirmPassword').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').text()).toContain('Create account')
  })

  it('validates password length and mismatch', async () => {
    const wrapper = mount(SignUpView, {
      global: { plugins: [router] }
    })

    await wrapper.find('input#email').setValue('test@example.com')
    await wrapper.find('input#password').setValue('123')
    await wrapper.find('input#confirmPassword').setValue('123')
    await wrapper.find('form').trigger('submit.prevent')

    expect(wrapper.text()).toContain('Password must be at least 6 characters')

    await wrapper.find('input#password').setValue('123456')
    await wrapper.find('input#confirmPassword').setValue('abcdef')
    await wrapper.find('form').trigger('submit.prevent')

    expect(wrapper.text()).toContain('Passwords do not match')
  })

  it('shows check email confirmation banner when required', async () => {
    const authStore = useAuthStore()
    vi.spyOn(authStore, 'signUp').mockResolvedValueOnce({
      success: true,
      needsEmailConfirmation: true
    })

    const wrapper = mount(SignUpView, {
      global: { plugins: [router] }
    })

    await wrapper.find('input#email').setValue('newuser@example.com')
    await wrapper.find('input#password').setValue('password123')
    await wrapper.find('input#confirmPassword').setValue('password123')
    await wrapper.find('form').trigger('submit.prevent')

    expect(wrapper.text()).toContain('Check your email')
    expect(wrapper.text()).toContain('newuser@example.com')
  })

  it('navigates to /today on immediate session', async () => {
    const authStore = useAuthStore()
    const habitStore = useHabitStore()
    vi.spyOn(authStore, 'signUp').mockResolvedValueOnce({
      success: true,
      needsEmailConfirmation: false
    })
    const initSpy = vi.spyOn(habitStore, 'initStore').mockResolvedValue()
    const pushSpy = vi.spyOn(router, 'push')

    const wrapper = mount(SignUpView, {
      global: { plugins: [router] }
    })

    await wrapper.find('input#email').setValue('direct@example.com')
    await wrapper.find('input#password').setValue('password123')
    await wrapper.find('input#confirmPassword').setValue('password123')
    await wrapper.find('form').trigger('submit.prevent')

    expect(initSpy).toHaveBeenCalled()
    expect(pushSpy).toHaveBeenCalledWith('/today')
  })
})
