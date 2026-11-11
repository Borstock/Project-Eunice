<script setup lang="ts">
defineProps<{
  isOpen: boolean
  habitName: string
}>()

const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'confirm'): void
}>()
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm transition-opacity"
    @click.self="emit('cancel')"
  >
    <div
      class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-gray-200 dark:border-gray-800 transform transition-all"
    >
      <div class="flex items-center space-x-3 text-rose-500 mb-3">
        <div
          class="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </div>
        <h3 class="text-lg font-bold text-gray-900 dark:text-white">Delete Habit?</h3>
      </div>

      <p class="text-sm text-gray-600 dark:text-gray-400">
        Are you sure you want to delete
        <span class="font-semibold text-gray-900 dark:text-gray-200">"{{ habitName }}"</span>? All
        streak history and logs for this habit will be permanently removed.
      </p>

      <div class="mt-6 flex items-center justify-end space-x-3">
        <button
          type="button"
          class="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          @click="emit('cancel')"
        >
          Cancel
        </button>
        <button
          type="button"
          class="px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 shadow-md shadow-rose-500/20 transition-colors"
          @click="emit('confirm')"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
</template>
