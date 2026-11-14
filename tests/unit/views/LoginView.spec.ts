import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import LoginView from '@/views/auth/LoginView.vue'
import { useAuthStore } from '@/stores/authStore'

describe('LoginView.vue', () => {
  let router: ReturnType<typeof createRouter>

  beforeEach(async () => {
    setActivePinia(createPinia())
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/login', component: LoginView },
        { path: '/today', component: { template: '<div>Today View</div>' } },
        { path: '/signup', component: { template: '<div>Signup View</div>' } },
        { path: '/forgot-password', component: { template: '<div>Forgot Password View</div>' } }
      ]
    })
    await router.push('/login')
    await router.isReady()
  })

  it('renders login form elements properly', () => {
    const wrapper = mount(LoginView, {
      global: { plugins: [router] }
    })

    expect(wrapper.find('input#email').exists()).toBe(true)
    expect(wrapper.find('input#password').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').text()).toContain('Sign in')
    expect(wrapper.text()).toContain('Sign up for free')
  })

  it('validates empty email and password inputs', async () => {
    const wrapper = mount(LoginView, {
      global: { plugins: [router] }
    })

    await wrapper.find('form').trigger('submit.prevent')
    expect(wrapper.text()).toContain('Please enter your email address')

    await wrapper.find('input#email').setValue('test@example.com')
    await wrapper.find('form').trigger('submit.prevent')
    expect(wrapper.text()).toContain('Please enter your password')
  })

  it('submits credentials and navigates on success', async () => {
    const authStore = useAuthStore()
    vi.spyOn(authStore, 'signIn').mockResolvedValueOnce({ success: true })
    const pushSpy = vi.spyOn(router, 'push')

    const wrapper = mount(LoginView, {
      global: { plugins: [router] }
    })

    await wrapper.find('input#email').setValue('test@example.com')
    await wrapper.find('input#password').setValue('password123')
    await wrapper.find('form').trigger('submit.prevent')

    expect(authStore.signIn).toHaveBeenCalledWith('test@example.com', 'password123')
    expect(pushSpy).toHaveBeenCalledWith('/today')
  })

  it('displays error message when sign in fails', async () => {
    const authStore = useAuthStore()
    authStore.error = 'Invalid email or password. Please check your credentials and try again.'
    vi.spyOn(authStore, 'signIn').mockResolvedValueOnce({
      success: false,
      error: authStore.error
    })

    const wrapper = mount(LoginView, {
      global: { plugins: [router] }
    })

    await wrapper.find('input#email').setValue('test@example.com')
    await wrapper.find('input#password').setValue('wrongpass')
    await wrapper.find('form').trigger('submit.prevent')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[role="alert"]').text()).toContain('Invalid email or password')
  })
})
