<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()

const email = ref('')
const localError = ref('')
const emailSent = ref(false)

async function handleResetRequest() {
  localError.value = ''
  authStore.clearError()

  if (!email.value.trim()) {
    localError.value = 'Please enter your email address.'
    return
  }

  const result = await authStore.resetPasswordForEmail(email.value)
  if (result.success) {
    emailSent.value = true
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
          <span>🔑</span>
        </div>
        <h1 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Reset your password
        </h1>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Enter your email and we'll send you a password reset link
        </p>
      </div>

      <div
        class="mt-8 bg-white dark:bg-gray-900 py-8 px-6 shadow-sm border border-gray-200 dark:border-gray-800 rounded-2xl sm:px-10"
      >
        <!-- Success State -->
        <div v-if="emailSent" class="text-center space-y-4 py-4">
          <div
            class="w-14 h-14 bg-indigo-50 dark:bg-indigo-950/60 rounded-full flex items-center justify-center mx-auto text-2xl"
          >
            <span>📬</span>
          </div>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Reset link sent</h2>
          <p class="text-sm text-gray-600 dark:text-gray-300">
            If an account exists for
            <strong class="text-indigo-600 dark:text-indigo-400">{{ email }}</strong
            >, we sent a password reset link. Please check your inbox and spam folder.
          </p>
          <div class="pt-4">
            <RouterLink
              to="/login"
              class="inline-flex justify-center items-center py-2 px-5 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
            >
              Return to Sign in
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

          <form class="space-y-4" @submit.prevent="handleResetRequest">
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

            <div class="pt-2">
              <button
                type="submit"
                :disabled="authStore.loading"
                class="w-full flex justify-center items-center py-2.5 px-4 rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span v-if="authStore.loading" class="inline-block animate-spin mr-2">⏳</span>
                {{ authStore.loading ? 'Sending link...' : 'Send reset link' }}
              </button>
            </div>
          </form>

          <div
            class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800 text-center space-y-3"
          >
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Remember your password?
              <RouterLink
                to="/login"
                class="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Sign in
              </RouterLink>
            </p>

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
