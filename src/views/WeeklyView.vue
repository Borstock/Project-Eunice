<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useHabitStore } from '@/stores/habitStore'
import WeeklyMatrix from '@/components/calendar/WeeklyMatrix.vue'

const habitStore = useHabitStore()
const habits = computed(() => habitStore.activeHabits)
</script>

<template>
  <div class="space-y-6 max-w-3xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Weekly Overview
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Review and backfill your habit completions across the past 7 days.
        </p>
      </div>

      <RouterLink
        v-if="habits.length > 0"
        to="/today"
        class="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-950 transition-colors"
      >
        <span>Today's Habits</span>
        <span>&rarr;</span>
      </RouterLink>
    </div>

    <!-- Empty State -->
    <div
      v-if="habits.length === 0"
      class="text-center py-16 px-4 bg-white dark:bg-gray-900/50 rounded-2xl border border-dashed border-gray-300 dark:border-gray-800 shadow-sm"
    >
      <div
        class="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-3xl mb-4"
      >
        📊
      </div>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">No habits to display</h3>
      <p class="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-1 mb-6">
        Once you create habits, your 7-day consistency calendar will appear here.
      </p>
      <RouterLink
        to="/habits"
        class="inline-flex px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 transition-all"
      >
        Create Habits
      </RouterLink>
    </div>

    <!-- Weekly Matrix Table -->
    <WeeklyMatrix v-else />
  </div>
</template>
