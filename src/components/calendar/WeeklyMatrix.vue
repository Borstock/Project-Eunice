<script setup lang="ts">
import { computed } from 'vue'
import { useHabitStore } from '@/stores/habitStore'
import { getPastDates, getTodayDateString, getShortDayName, getDayNumber } from '@/utils/date'

const habitStore = useHabitStore()

const todayStr = getTodayDateString()
const last7Days = computed(() => getPastDates(7, todayStr))

const habits = computed(() => habitStore.activeHabits)

function isDateCompleted(habitId: string, dateStr: string): boolean {
  return habitStore.isCompletedOnDate(habitId, dateStr)
}

function toggleDate(habitId: string, dateStr: string) {
  habitStore.toggleCompletion(habitId, dateStr)
}

const weeklyCompletionRate = computed(() => {
  if (habits.value.length === 0) return 0
  const totalSlots = habits.value.length * 7
  let completedSlots = 0

  for (const habit of habits.value) {
    for (const d of last7Days.value) {
      if (isDateCompleted(habit.id, d)) {
        completedSlots++
      }
    }
  }

  return Math.round((completedSlots / totalSlots) * 100)
})
</script>

<template>
  <div class="space-y-6">
    <!-- Weekly Summary Card -->
    <div
      class="p-4 sm:p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
    >
      <div>
        <h3 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          7-Day Consistency Rate
        </h3>
        <p class="text-2xl font-black text-gray-900 dark:text-white mt-0.5">
          {{ weeklyCompletionRate }}%
        </p>
      </div>

      <div class="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
        <div class="flex items-center space-x-1.5">
          <span class="w-3.5 h-3.5 rounded-md bg-emerald-500 inline-block" />
          <span>Completed</span>
        </div>
        <div class="flex items-center space-x-1.5">
          <span class="w-3.5 h-3.5 rounded-md bg-gray-200 dark:bg-gray-700 inline-block" />
          <span>Missed</span>
        </div>
      </div>
    </div>

    <!-- Matrix Table Container (Scrollable on small screens) -->
    <div
      class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden"
    >
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr
              class="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30"
            >
              <th
                class="py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 min-w-[140px]"
              >
                Habit
              </th>
              <th
                v-for="d in last7Days"
                :key="d"
                class="py-3 px-2 text-center text-xs font-medium min-w-[50px]"
                :class="
                  d === todayStr
                    ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/40 dark:bg-indigo-950/30'
                    : 'text-gray-500 dark:text-gray-400'
                "
              >
                <div class="leading-none">{{ getShortDayName(d) }}</div>
                <div class="text-sm mt-1 font-semibold">{{ getDayNumber(d) }}</div>
              </th>
            </tr>
          </thead>

          <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
            <tr
              v-for="habit in habits"
              :key="habit.id"
              class="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors"
            >
              <!-- Habit Info Cell -->
              <td class="py-3 px-4">
                <div class="flex items-center space-x-2.5">
                  <span
                    class="w-7 h-7 rounded-lg flex items-center justify-center text-base shrink-0"
                    :style="{ backgroundColor: `${habit.color}1a` }"
                  >
                    {{ habit.emoji }}
                  </span>
                  <span
                    class="font-medium text-sm text-gray-900 dark:text-white truncate max-w-[130px] sm:max-w-[180px]"
                  >
                    {{ habit.name }}
                  </span>
                </div>
              </td>

              <!-- Day Cells -->
              <td
                v-for="d in last7Days"
                :key="d"
                class="py-3 px-2 text-center"
                :class="d === todayStr ? 'bg-indigo-50/20 dark:bg-indigo-950/15' : ''"
              >
                <button
                  type="button"
                  class="w-8 h-8 mx-auto rounded-xl flex items-center justify-center text-xs transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 dark:focus:ring-offset-gray-900 active:scale-90"
                  :class="
                    isDateCompleted(habit.id, d)
                      ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/25'
                      : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-transparent'
                  "
                  :title="`Toggle ${habit.name} for ${d}`"
                  @click="toggleDate(habit.id, d)"
                >
                  <svg
                    class="w-4 h-4 stroke-[2.5]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
