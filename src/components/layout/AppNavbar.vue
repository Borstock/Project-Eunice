<script setup lang="ts">
import { RouterLink, useRoute, useRouter } from 'vue-router'
import ThemeToggle from './ThemeToggle.vue'
import { APP_NAME } from '@/config/env'
import { useAuthStore } from '@/stores/authStore'
import { useHabitStore } from '@/stores/habitStore'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const habitStore = useHabitStore()

const navItems = [
  { name: 'Today', path: '/today' },
  { name: 'Weekly', path: '/weekly' },
  { name: 'Stats', path: '/stats' },
  { name: 'Manage Habits', path: '/habits' },
  { name: 'Settings', path: '/settings' }
]

function isActive(path: string): boolean {
  return route?.path === path
}

async function handleSignOut() {
  await authStore.signOut()
  await habitStore.initStore()
  router.push('/today')
}
</script>

<template>
  <header
    class="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 transition-colors"
  >
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Logo / Brand -->
        <RouterLink to="/today" class="flex items-center space-x-2.5 group">
          <div
            class="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform"
          >
            <span class="text-lg">🎯</span>
          </div>
          <span class="font-bold text-lg text-gray-900 dark:text-white tracking-tight">
            {{ APP_NAME }}
          </span>
        </RouterLink>

        <!-- Desktop Navigation Links -->
        <nav class="hidden md:flex items-center space-x-1">
          <RouterLink
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="px-3.5 py-2 rounded-lg text-sm font-medium transition-colors"
            :class="
              isActive(item.path)
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
            "
          >
            {{ item.name }}
          </RouterLink>
        </nav>

        <!-- Actions: Sync Status, Auth & Theme Toggle -->
        <div class="flex items-center space-x-2">
          <!-- Sync Status Badge (Authenticated only) -->
          <div v-if="authStore.isAuthenticated" class="hidden sm:flex items-center text-xs mr-1">
            <span
              v-if="habitStore.syncStatus === 'syncing' || habitStore.migrationPromptOpen"
              class="inline-flex items-center gap-1 text-gray-500 dark:text-gray-400 font-medium"
              title="Syncing changes with cloud..."
            >
              <span class="inline-block animate-spin text-[10px]">🔄</span>
              <span class="hidden md:inline text-[11px]">
                {{ habitStore.migrationPromptOpen ? 'Migration pending' : 'Syncing...' }}
              </span>
            </span>

            <button
              v-else-if="habitStore.syncStatus === 'error'"
              type="button"
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-400 hover:bg-red-100 transition-colors"
              :title="habitStore.syncError ?? 'Sync failed'"
              @click="habitStore.retrySync"
            >
              <span>⚠️</span>
              <span>Sync error (Retry)</span>
            </button>

            <span
              v-else
              class="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium"
              title="Cloud data is in sync"
            >
              <span class="text-xs">☁️</span>
              <span class="hidden md:inline text-[11px]">Synced</span>
            </span>
          </div>

          <!-- Authenticated State -->
          <div v-if="authStore.isAuthenticated" class="flex items-center space-x-2">
            <span
              class="hidden sm:inline-block text-xs font-medium text-gray-600 dark:text-gray-300 max-w-[120px] truncate"
              :title="authStore.userEmail ?? ''"
            >
              {{ authStore.userEmail }}
            </span>
            <button
              type="button"
              class="text-xs font-medium px-2.5 py-1.5 rounded-lg text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              @click="handleSignOut"
            >
              Log out
            </button>
          </div>

          <!-- Guest State -->
          <div v-else class="flex items-center space-x-2">
            <RouterLink
              to="/login"
              class="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors"
            >
              Sign in
            </RouterLink>
          </div>

          <ThemeToggle />
        </div>
      </div>
    </div>
  </header>

  <!-- Mobile Bottom Navigation Bar -->
  <nav
    class="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 py-1.5 px-4 flex justify-around items-center"
  >
    <RouterLink
      to="/today"
      class="flex flex-col items-center py-1 px-3 rounded-lg text-xs font-medium transition-colors"
      :class="
        isActive('/today')
          ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
          : 'text-gray-500 dark:text-gray-400'
      "
    >
      <span class="text-base mb-0.5">📅</span>
      <span>Today</span>
    </RouterLink>

    <RouterLink
      to="/weekly"
      class="flex flex-col items-center py-1 px-3 rounded-lg text-xs font-medium transition-colors"
      :class="
        isActive('/weekly')
          ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
          : 'text-gray-500 dark:text-gray-400'
      "
    >
      <span class="text-base mb-0.5">📊</span>
      <span>Weekly</span>
    </RouterLink>

    <RouterLink
      to="/stats"
      class="flex flex-col items-center py-1 px-3 rounded-lg text-xs font-medium transition-colors"
      :class="
        isActive('/stats')
          ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
          : 'text-gray-500 dark:text-gray-400'
      "
    >
      <span class="text-base mb-0.5">📈</span>
      <span>Stats</span>
    </RouterLink>

    <RouterLink
      to="/habits"
      class="flex flex-col items-center py-1 px-3 rounded-lg text-xs font-medium transition-colors"
      :class="
        isActive('/habits')
          ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
          : 'text-gray-500 dark:text-gray-400'
      "
    >
      <span class="text-base mb-0.5">⚙️</span>
      <span>Habits</span>
    </RouterLink>

    <RouterLink
      to="/settings"
      class="flex flex-col items-center py-1 px-3 rounded-lg text-xs font-medium transition-colors"
      :class="
        isActive('/settings')
          ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
          : 'text-gray-500 dark:text-gray-400'
      "
    >
      <span class="text-base mb-0.5">🛠️</span>
      <span>Settings</span>
    </RouterLink>
  </nav>
</template>
