<script setup lang="ts">
import type { Habit } from '@/models/habit'
import StreakBadge from './StreakBadge.vue'

defineProps<{
  habit: Habit
  isCompleted: boolean
  streak: number
}>()

const emit = defineEmits<{
  (e: 'toggle'): void
}>()
</script>

<template>
  <div
    class="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-2xl border transition-all duration-200"
    :class="
      isCompleted
        ? 'border-emerald-300/60 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/10 shadow-sm'
        : 'border-gray-200 dark:border-gray-800 shadow-sm hover:border-gray-300 dark:hover:border-gray-700'
    "
  >
    <!-- Habit Details -->
    <div class="flex items-center space-x-3.5 min-w-0 pr-3">
      <div
        class="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 transition-transform shadow-inner"
        :style="{ backgroundColor: `${habit.color}1f` }"
      >
        <span>{{ habit.emoji }}</span>
      </div>

      <div class="min-w-0">
        <h3
          class="font-semibold text-base tracking-tight truncate transition-colors"
          :class="
            isCompleted
              ? 'text-gray-500 dark:text-gray-400 line-through'
              : 'text-gray-900 dark:text-white'
          "
        >
          {{ habit.name }}
        </h3>
        <div class="mt-1 flex items-center space-x-2">
          <StreakBadge :streak="streak" />
        </div>
      </div>
    </div>

    <!-- Completion Checkbox / Toggle Button -->
    <button
      type="button"
      class="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900 active:scale-95"
      :class="
        isCompleted
          ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/25'
          : 'border-gray-300 dark:border-gray-700 hover:border-emerald-500 dark:hover:border-emerald-500 bg-white dark:bg-gray-800 text-transparent'
      "
      :aria-label="isCompleted ? `Mark ${habit.name} incomplete` : `Mark ${habit.name} complete`"
      @click="emit('toggle')"
    >
      <svg
        class="w-6 h-6 stroke-[3] transition-transform duration-200"
        :class="isCompleted ? 'scale-100' : 'scale-50'"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </button>
  </div>
</template>
