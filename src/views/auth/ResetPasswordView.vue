<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()

const newPassword = ref('')
const confirmPassword = ref('')
const localError = ref('')
const success = ref(false)

async function handleUpdatePassword() {
  localError.value = ''
  authStore.clearError()

  if (newPassword.value.length < 6) {
    localError.value = 'Password must be at least 6 characters long.'
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    localError.value = 'Passwords do not match. Please verify.'
    return
  }

  const result = await authStore.updatePassword(newPassword.value)
  if (result.success) {
    success.value = true
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
          <span>🔐</span>
        </div>
        <h1 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Set new password
        </h1>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Enter your new password below to secure your account
        </p>
      </div>

      <div
        class="mt-8 bg-white dark:bg-gray-900 py-8 px-6 shadow-sm border border-gray-200 dark:border-gray-800 rounded-2xl sm:px-10"
      >
        <!-- Success State -->
        <div v-if="success" class="text-center space-y-4 py-4">
          <div
            class="w-14 h-14 bg-green-50 dark:bg-green-950/60 rounded-full flex items-center justify-center mx-auto text-2xl text-green-600 dark:text-green-400"
          >
            <span>✅</span>
          </div>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            Password updated successfully
          </h2>
          <p class="text-sm text-gray-600 dark:text-gray-300">
            Your account password has been changed. You can now continue using Habit Tracker.
          </p>
          <div class="pt-4">
            <RouterLink
              to="/today"
              class="inline-flex justify-center items-center py-2.5 px-5 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
            >
              Continue to Habits
            </RouterLink>
          </div>
        </div>

        <!-- Form State -->
        <div v-else>
          <!-- Error alert -->
          <div
            v-if="localError || authStore.error"
            role="alert"
            class="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300 flex items-start gap-3"
          >
            <span class="text-base flex-shrink-0">⚠️</span>
            <p>{{ localError || authStore.error }}</p>
          </div>

          <form class="space-y-4" @submit.prevent="handleUpdatePassword">
            <div>
              <label
                for="newPassword"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                New password (min. 6 characters)
              </label>
              <input
                id="newPassword"
                v-model="newPassword"
                type="password"
                autocomplete="new-password"
                required
                minlength="6"
                placeholder="••••••••"
                class="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-sm"
              />
            </div>

            <div>
              <label
                for="confirmPassword"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Confirm new password
              </label>
              <input
                id="confirmPassword"
                v-model="confirmPassword"
                type="password"
                autocomplete="new-password"
                required
                placeholder="••••••••"
                class="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-sm"
              />
            </div>

            <div class="pt-2">
              <button
                type="submit"
                :disabled="authStore.loading"
                class="w-full flex justify-center items-center py-2.5 px-4 rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span v-if="authStore.loading" class="inline-block animate-spin mr-2">⏳</span>
                {{ authStore.loading ? 'Updating password...' : 'Update password' }}
              </button>
            </div>
          </form>

          <div
            class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800 text-center space-y-3"
          >
            <div>
              <RouterLink
                to="/today"
                class="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:underline"
              >
                ← Back to App
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
