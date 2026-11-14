<script setup lang="ts">
import { ref } from 'vue'
import { useHabitStore } from '@/stores/habitStore'

const habitStore = useHabitStore()
const migrationError = ref<string | null>(null)

async function handleUpload() {
  migrationError.value = null
  try {
    await habitStore.executeMigration()
  } catch (err) {
    migrationError.value = (err as Error).message || 'Failed to upload habits. Please try again.'
  }
}

function handleStartEmpty() {
  habitStore.dismissMigration(true)
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="habitStore.migrationPromptOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="migration-title"
    >
      <div
        class="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-150"
      >
        <div class="flex items-start gap-4">
          <div
            class="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-2xl flex-shrink-0"
          >
            <span>☁️</span>
          </div>
          <div>
            <h3 id="migration-title" class="text-xl font-bold text-gray-900 dark:text-white">
              Migrate your local habits
            </h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              We found existing habits stored on this device. Would you like to upload them to your
              cloud account?
            </p>
          </div>
        </div>

        <!-- Summary Badge Card -->
        <div
          v-if="habitStore.localMigrationCandidate"
          class="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200/80 dark:border-gray-700/50 space-y-2 text-sm text-gray-700 dark:text-gray-300"
        >
          <div class="flex justify-between items-center">
            <span class="font-medium">Local habits found:</span>
            <span class="font-bold text-indigo-600 dark:text-indigo-400">
              {{ habitStore.localMigrationCandidate.habits.length }}
            </span>
          </div>
          <div class="flex justify-between items-center">
            <span class="font-medium">Completion records:</span>
            <span class="font-bold text-indigo-600 dark:text-indigo-400">
              {{ habitStore.localMigrationCandidate.completionsCount }}
            </span>
          </div>
          <p class="pt-1 text-xs text-gray-500 dark:text-gray-400">
            🔒 Demo habits are automatically excluded. Local data is safely preserved until the
            upload succeeds.
          </p>
        </div>

        <!-- Error alert -->
        <div
          v-if="migrationError"
          role="alert"
          class="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300 flex items-start gap-2.5"
        >
          <span class="text-base flex-shrink-0">⚠️</span>
          <p>{{ migrationError }}</p>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-col sm:flex-row-reverse gap-3 pt-2">
          <button
            type="button"
            :disabled="habitStore.migrationLoading"
            class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors shadow-sm disabled:opacity-50"
            @click="handleUpload"
          >
            <span v-if="habitStore.migrationLoading" class="inline-block animate-spin">⏳</span>
            {{ habitStore.migrationLoading ? 'Uploading...' : 'Upload to my account' }}
          </button>
          <button
            type="button"
            :disabled="habitStore.migrationLoading"
            class="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            @click="handleStartEmpty"
          >
            Start empty
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
