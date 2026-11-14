<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useHabitStore } from '@/stores/habitStore'

const router = useRouter()
const authStore = useAuthStore()
const habitStore = useHabitStore()

const email = ref('')
const password = ref('')
const localError = ref('')

async function handleLogin() {
  localError.value = ''
  authStore.clearError()

  if (!email.value.trim()) {
    localError.value = 'Please enter your email address.'
    return
  }

  if (!password.value) {
    localError.value = 'Please enter your password.'
    return
  }

  const result = await authStore.signIn(email.value, password.value)
  if (result.success) {
    await habitStore.initStore()
    router.push('/today')
  } else if (result.error) {
    localError.value = result.error
  }
}
</script>

<template>
  <div class="min-h-[70vh] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <div class="text-center">
        <div
          class="w-12 h-12 rounded-2xl bg-indigo-600 mx-auto flex items-center justify-center text-white text-2xl shadow-lg shadow-indigo-500/25 mb-4"
        >
          <span>🎯</span>
        </div>
        <h1 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Sign in to your account
        </h1>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Sync your habits securely across all your devices
        </p>
      </div>

      <div
        class="mt-8 bg-white dark:bg-gray-900 py-8 px-6 shadow-sm border border-gray-200 dark:border-gray-800 rounded-2xl sm:px-10"
      >
        <!-- Error alert -->
        <div
          v-if="localError || authStore.error"
          role="alert"
          class="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300 flex items-start gap-3"
        >
          <span class="text-base flex-shrink-0">⚠️</span>
          <p>{{ localError || authStore.error }}</p>
        </div>

        <form class="space-y-5" @submit.prevent="handleLogin">
          <div>
            <label
              for="email"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Email address
            </label>
            <input
              id="email"
              v-model="email"
              type="email"
              autocomplete="email"
              required
              placeholder="you@example.com"
              class="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-sm"
            />
          </div>

          <div>
            <div class="flex items-center justify-between mb-1">
              <label
                for="password"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Password
              </label>
              <RouterLink
                to="/forgot-password"
                class="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
              >
                Forgot password?
              </RouterLink>
            </div>
            <input
              id="password"
              v-model="password"
              type="password"
              autocomplete="current-password"
              required
              placeholder="••••••••"
              class="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-sm"
            />
          </div>

          <div>
            <button
              type="submit"
              :disabled="authStore.loading"
              class="w-full flex justify-center items-center py-2.5 px-4 rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span v-if="authStore.loading" class="inline-block animate-spin mr-2">⏳</span>
              {{ authStore.loading ? 'Signing in...' : 'Sign in' }}
            </button>
          </div>
        </form>

        <div class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800 text-center space-y-3">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?
            <RouterLink
              to="/signup"
              class="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Sign up for free
            </RouterLink>
          </p>

          <div>
            <RouterLink
              to="/today"
              class="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:underline"
            >
              ← Continue as Guest (Local data only)
            </RouterLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
