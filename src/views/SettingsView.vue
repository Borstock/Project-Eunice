<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useHabitStore } from '@/stores/habitStore'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const habitStore = useHabitStore()
const authStore = useAuthStore()

// ── confirmation dialog state ──────────────────────────────────────────────
type DialogAction = 'load' | 'remove' | null
const pendingAction = ref<DialogAction>(null)

function requestAction(action: DialogAction) {
  pendingAction.value = action
}

function cancelAction() {
  pendingAction.value = null
}

function confirmAction() {
  if (pendingAction.value === 'load') {
    habitStore.loadDemoData()
  } else if (pendingAction.value === 'remove') {
    habitStore.removeDemoData()
  }
  pendingAction.value = null
}

async function handleSignOut() {
  await authStore.signOut()
  router.push('/today')
}

// ── derived state ──────────────────────────────────────────────────────────
const hasDemoData = computed(() => habitStore.hasDemoData())

const dialogTitle = computed(() =>
  pendingAction.value === 'load' ? 'Load demo data?' : 'Remove demo data?'
)

const dialogBody = computed(() =>
  pendingAction.value === 'load'
    ? 'This will add 5 demo habits with 90 days of history. Your real habits are never touched.'
    : 'This will permanently delete the 5 demo habits and their history. Your real habits are untouched.'
)
</script>

<template>
  <div class="space-y-8">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Manage your Habit Tracker preferences.
      </p>
    </div>

    <!-- Account & Cloud Sync Section -->
    <section
      class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-4"
    >
      <div class="flex items-center justify-between">
        <h2 class="text-base font-semibold text-gray-900 dark:text-white">Account & Cloud Sync</h2>
        <span
          v-if="authStore.isAuthenticated"
          class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-300"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-green-500"></span>
          Cloud Sync Enabled
        </span>
        <span
          v-else
          class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          Using local data only
        </span>
      </div>

      <!-- Authenticated Details -->
      <div v-if="authStore.isAuthenticated" class="space-y-4">
        <div>
          <p class="text-sm text-gray-600 dark:text-gray-300">
            Signed in as
            <strong class="font-semibold text-gray-900 dark:text-white">
              {{ authStore.userEmail }}
            </strong>
          </p>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Your habits and history are stored securely in the cloud under your account.
          </p>
        </div>

        <div>
          <button
            type="button"
            :disabled="authStore.loading"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-950/70 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
            @click="handleSignOut"
          >
            <span>🚪</span>
            Log out
          </button>
        </div>
      </div>

      <!-- Guest Details -->
      <div v-else class="space-y-4">
        <p class="text-sm text-gray-600 dark:text-gray-300">
          You are currently tracking habits in guest mode. Your data is stored only in this
          browser's local storage.
        </p>

        <div class="flex flex-col sm:flex-row gap-3">
          <RouterLink
            to="/signup"
            class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors shadow-sm"
          >
            <span>✨</span>
            Create free account
          </RouterLink>
          <RouterLink
            to="/login"
            class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
          >
            Sign in
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- Demo Data Section -->
    <section
      class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-4"
    >
      <div>
        <h2 class="text-base font-semibold text-gray-900 dark:text-white">Demo data</h2>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Populate the app with 5 sample habits and 90 days of realistic history so you can explore
          the statistics without having to track habits for weeks.
        </p>
      </div>

      <div class="flex flex-col sm:flex-row gap-3">
        <!-- Load button — disabled when demo data already present -->
        <button
          :disabled="hasDemoData"
          class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
          :class="
            hasDemoData
              ? 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600'
          "
          @click="requestAction('load')"
        >
          <span>🗂️</span>
          Load demo data
        </button>

        <!-- Remove button — only shown when demo data exists -->
        <button
          v-if="hasDemoData"
          class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-950/70"
          @click="requestAction('remove')"
        >
          <span>🗑️</span>
          Remove demo data
        </button>
      </div>

      <!-- Status indicator -->
      <p
        v-if="hasDemoData"
        class="text-xs text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1"
      >
        <span>✅</span> Demo data is currently loaded.
      </p>
    </section>

    <!-- Confirmation Dialog -->
    <Teleport to="body">
      <div
        v-if="pendingAction !== null"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="'dialog-title'"
      >
        <div
          class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl max-w-md w-full p-6 space-y-4"
        >
          <h3 id="dialog-title" class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ dialogTitle }}
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ dialogBody }}
          </p>

          <div class="flex justify-end gap-3 pt-2">
            <button
              class="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
              @click="cancelAction"
            >
              Cancel
            </button>
            <button
              class="px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2"
              :class="
                pendingAction === 'load'
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500'
                  : 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
              "
              @click="confirmAction"
            >
              {{ pendingAction === 'load' ? 'Load' : 'Remove' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
