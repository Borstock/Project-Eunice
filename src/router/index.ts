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
      path: '/habits',
      name: 'habits',
      component: () => import('@/views/HabitsView.vue')
    }
  ]
})

export default router
