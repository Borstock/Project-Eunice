import { createRouter, createWebHistory } from 'vue-router'

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
    }
  ]
})

export default router
