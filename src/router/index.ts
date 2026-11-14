import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/today'
    },
    {
      path: '/today',
      name: 'today',
      component: () => import('@/views/TodayView.vue')
    },
    {
      path: '/weekly',
      name: 'weekly',
      component: () => import('@/views/WeeklyView.vue')
    },
    {
      path: '/stats',
      name: 'stats',
      component: () => import('@/views/StatsView.vue')
    },
    {
      path: '/habits',
      name: 'habits',
      component: () => import('@/views/HabitsView.vue')
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/SettingsView.vue')
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { guestOnly: true }
    },
    {
      path: '/signup',
      name: 'signup',
      component: () => import('@/views/auth/SignUpView.vue'),
      meta: { guestOnly: true }
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: () => import('@/views/auth/ForgotPasswordView.vue'),
      meta: { guestOnly: true }
    },
    {
      path: '/reset-password',
      name: 'reset-password',
      component: () => import('@/views/auth/ResetPasswordView.vue'),
      meta: { requiresAuth: true }
    }
  ]
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  // Ensure auth state is initialized from session before evaluating guards
  if (!authStore.isInitialized) {
    await authStore.initialize()
  }

  // Redirect authenticated users away from login, signup, forgot-password
  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return { path: '/today' }
  }

  // Check routes that require authentication
  if (to.meta.requiresAuth && !authStore.isAuthenticated && !authStore.passwordRecoveryActive) {
    return { path: '/login' }
  }
})

export default router
