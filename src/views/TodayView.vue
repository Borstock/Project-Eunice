<script setup lang="ts">
import { ref, computed } from 'vue'
import { useHabitStore } from '@/stores/habitStore'
import { getTodayDateString, formatFullDate } from '@/utils/date'
import HabitCard from '@/components/habit/HabitCard.vue'
import HabitFormModal from '@/components/habit/HabitFormModal.vue'

const habitStore = useHabitStore()
const isModalOpen = ref(false)

const todayFormatted = computed(() => {
  return formatFullDate(getTodayDateString())
})

const habitsWithStatus = computed(() => habitStore.habitsWithStatus)
const totalHabits = computed(() => habitStore.activeHabits.length)
const completedCount = computed(() => habitStore.todayCompletedCount)
const completionRate = computed(() => habitStore.todayCompletionRate)

const allDoneToday = computed(
  () => totalHabits.value > 0 && completedCount.value === totalHabits.value
)

function handleToggleHabit(habitId: string) {
  habitStore.toggleCompletion(habitId, getTodayDateString())
}

function handleSaveHabit(payload: { name: string; emoji: string; color: string }) {
  habitStore.createHabit(payload)
}
</script>

<template>
  <div class="space-y-6 max-w-2xl mx-auto">
    <!-- Header & Daily Progress -->
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <div>
          <span
            class="text-xs uppercase tracking-wider font-semibold text-indigo-600 dark:text-indigo-400"
          >
            Daily Momentum
          </span>
          <h1
            class="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white mt-0.5"
          >
            {{ todayFormatted }}
          </h1>
        </div>

        <button
          type="button"
          class="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-sm shadow-indigo-500/20 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          @click="isModalOpen = true"
        >
          <span class="text-base leading-none">+</span>
          <span class="hidden sm:inline">Add Habit</span>
        </button>
      </div>

      <!-- Progress Card (visible when habits exist) -->
      <div
        v-if="totalHabits > 0"
        class="p-4 sm:p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-2.5"
      >
        <div class="flex items-center justify-between text-sm">
          <span class="font-medium text-gray-700 dark:text-gray-300">
            {{ completedCount }} of {{ totalHabits }} habits completed
          </span>
          <span class="font-bold text-indigo-600 dark:text-indigo-400">
            {{ completionRate }}%
          </span>
        </div>

        <!-- Progress bar track -->
        <div class="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5 overflow-hidden">
          <div
            class="bg-indigo-600 h-full rounded-full transition-all duration-500 ease-out"
            :style="{ width: `${completionRate}%` }"
          />
        </div>
      </div>
    </div>

    <!-- All Done Celebration Banner -->
    <div
      v-if="allDoneToday"
      class="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-500/20 text-emerald-900 dark:text-emerald-200 flex items-center space-x-3.5"
    >
      <span class="text-2xl shrink-0">🎉</span>
      <div>
        <p class="font-semibold text-sm">All habits completed today!</p>
        <p class="text-xs text-emerald-700 dark:text-emerald-300/80">
          Incredible discipline! Your consistency is paying off.
        </p>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-if="totalHabits === 0"
      class="text-center py-16 px-4 bg-white dark:bg-gray-900/50 rounded-2xl border border-dashed border-gray-300 dark:border-gray-800 shadow-sm"
    >
      <div
        class="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-3xl mb-4"
      >
        🌱
      </div>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Start Your First Habit</h3>
      <p class="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-1 mb-6">
        Small daily habits lead to life-changing results. Add a habit to begin tracking your streaks
        today.
      </p>
      <button
        type="button"
        class="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 transition-all"
        @click="isModalOpen = true"
      >
        + Add First Habit
      </button>
    </div>

    <!-- Habits Checklist -->
    <div v-else class="space-y-3">
      <HabitCard
        v-for="habit in habitsWithStatus"
        :key="habit.id"
        :habit="habit"
        :is-completed="habit.isCompletedToday"
        :streak="habit.currentStreak"
        @toggle="handleToggleHabit(habit.id)"
      />
    </div>

    <!-- Add Habit Modal -->
    <HabitFormModal :is-open="isModalOpen" @close="isModalOpen = false" @save="handleSaveHabit" />
  </div>
</template>
