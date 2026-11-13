<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useHabitStore } from '@/stores/habitStore'
import { useSettingsStore } from '@/stores/settingsStore'
import {
  calculateOverallSummary,
  calculateHabitStats,
  calculateWeeklyStats,
  calculateDayOfWeekStats,
  type HabitStats,
} from '@/utils/statsCalculator'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  type ChartData,
  type ChartOptions,
} from 'chart.js'
import { Bar } from 'vue-chartjs'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const habitStore = useHabitStore()
const settingsStore = useSettingsStore()

const selectedHabitId = ref<string>('all')

const isDark = computed(() => settingsStore.isDark)

const habits = computed(() => habitStore.activeHabits)
const completions = computed(() => habitStore.completions)

// Check if there is any completion history
const totalCompletionsCount = computed(() => {
  return Object.values(completions.value).reduce(
    (total, dates) => total + (dates?.length || 0),
    0
  )
})

const hasHistory = computed(() => {
  return habits.value.length > 0 && totalCompletionsCount.value > 0
})

// Filtered habits based on selection
const targetHabits = computed(() => {
  if (selectedHabitId.value === 'all') {
    return habits.value
  }
  return habits.value.filter((h) => h.id === selectedHabitId.value)
})

// Calculations
const overallSummary = computed(() => {
  return calculateOverallSummary(habits.value, completions.value)
})

const perHabitStats = computed<HabitStats[]>(() => {
  return habits.value.map((h) =>
    calculateHabitStats(h, completions.value[h.id] || [])
  )
})

const weeklyData = computed(() => {
  return calculateWeeklyStats(targetHabits.value, completions.value, 12)
})

const dayOfWeekData = computed(() => {
  return calculateDayOfWeekStats(targetHabits.value, completions.value, 90)
})

// Colors adapted to theme
const textColor = computed(() => (isDark.value ? '#9ca3af' : '#6b7280'))
const gridColor = computed(() => (isDark.value ? '#374151' : '#f3f4f6'))
const missedBarColor = computed(() => (isDark.value ? '#374151' : '#e5e7eb'))

// Stacked Bar Chart: Weekly Completed vs Missed
const weeklyChartData = computed<ChartData<'bar'>>(() => {
  return {
    labels: weeklyData.value.map((w) => w.label),
    datasets: [
      {
        label: 'Completed',
        data: weeklyData.value.map((w) => w.completed),
        backgroundColor: '#6366f1',
        borderRadius: 4,
      },
      {
        label: 'Missed',
        data: weeklyData.value.map((w) => w.missed),
        backgroundColor: missedBarColor.value,
        borderRadius: 4,
      },
    ],
  }
})

const weeklyChartOptions = computed<ChartOptions<'bar'>>(() => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: isDark.value ? '#e5e7eb' : '#374151',
          boxWidth: 12,
        },
      },
      tooltip: {
        callbacks: {
          afterBody: (items) => {
            const idx = items[0]?.dataIndex ?? 0
            const item = weeklyData.value[idx]
            return item ? `Rate: ${item.rate}%` : ''
          },
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: { color: gridColor.value },
        ticks: { color: textColor.value, font: { size: 11 } },
      },
      y: {
        stacked: true,
        grid: { color: gridColor.value },
        ticks: { color: textColor.value, precision: 0 },
      },
    },
  }
})

// Bar Chart: Day of Week Completion Rate
const dayOfWeekChartData = computed<ChartData<'bar'>>(() => {
  return {
    labels: dayOfWeekData.value.map((d) => d.dayName),
    datasets: [
      {
        label: 'Completion Rate (%)',
        data: dayOfWeekData.value.map((d) => d.rate),
        backgroundColor: '#10b981',
        borderRadius: 6,
      },
    ],
  }
})

const dayOfWeekChartOptions = computed<ChartOptions<'bar'>>(() => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (item) => `Rate: ${item.parsed.y}%`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: textColor.value },
      },
      y: {
        min: 0,
        max: 100,
        grid: { color: gridColor.value },
        ticks: {
          color: textColor.value,
          callback: (value) => `${value}%`,
        },
      },
    },
  }
})

// Accessibility summary text
const accessibleSummary = computed(() => {
  if (!hasHistory.value) {
    return 'No habit statistics available yet.'
  }
  const summary = overallSummary.value
  const habitFilterText =
    selectedHabitId.value === 'all'
      ? `all ${habits.value.length} habits`
      : `selected habit`
  return `Statistics overview for ${habitFilterText}. Over the last 30 days, your overall completion rate is ${summary.overallRate30}%. Your all-time best streak is ${summary.bestStreak} days. ${summary.habitsOnTrack} habits are currently on track, and ${summary.habitsStruggling} habits are struggling.`
})

function handleLoadDemoData() {
  habitStore.loadDemoData()
}
</script>

<template>
  <div class="space-y-8 pb-12">
    <!-- Header with Habit Filter -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Statistics</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Track consistency, completion rates, and streak patterns over time.
        </p>
      </div>

      <!-- Habit Filter -->
      <div v-if="habits.length > 0" class="w-full sm:w-auto">
        <label for="habit-filter" class="sr-only">Filter by habit</label>
        <select
          id="habit-filter"
          v-model="selectedHabitId"
          class="w-full sm:w-56 px-3.5 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
        >
          <option value="all">All Habits ({{ habits.length }})</option>
          <option v-for="habit in habits" :key="habit.id" :value="habit.id">
            {{ habit.emoji }} {{ habit.name }}
          </option>
        </select>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-if="!hasHistory"
      class="bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-300 dark:border-gray-800 p-8 sm:p-12 text-center"
    >
      <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-3xl">
        📊
      </div>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        No habit history yet
      </h3>
      <p class="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
        Track your habits on the Today view or load demo data to explore rich charts, completion rates, and streak analysis immediately.
      </p>
      <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          type="button"
          class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          @click="handleLoadDemoData"
        >
          <span>🗂️</span>
          Load demo data
        </button>
        <RouterLink
          to="/today"
          class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <span>📅</span>
          Go to Today
        </RouterLink>
      </div>
    </div>

    <!-- Data State -->
    <template v-else>
      <!-- Accessible Screen Reader & Visible Text Summary -->
      <section
        class="bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl p-4 text-sm text-indigo-900 dark:text-indigo-200"
        aria-label="Summary overview"
      >
        <p class="flex items-start gap-2">
          <span class="text-base">💡</span>
          <span>{{ accessibleSummary }}</span>
        </p>
      </section>

      <!-- Summary Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Overall 30d Rate -->
        <div class="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <span class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            30-Day Rate
          </span>
          <div class="mt-2 flex items-baseline gap-2">
            <span class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {{ overallSummary.overallRate30 }}%
            </span>
            <span class="text-xs text-gray-400">
              (90d: {{ overallSummary.overallRate90 }}%)
            </span>
          </div>
        </div>

        <!-- Best Streak -->
        <div class="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <span class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Best Streak
          </span>
          <div class="mt-2 flex items-baseline gap-1.5">
            <span class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {{ overallSummary.bestStreak }}
            </span>
            <span class="text-sm font-medium text-gray-500 dark:text-gray-400">days</span>
            <span class="text-base ml-1">🔥</span>
          </div>
        </div>

        <!-- Habits on Track -->
        <div class="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <span class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            On Track (≥70%)
          </span>
          <div class="mt-2 flex items-baseline gap-1.5">
            <span class="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {{ overallSummary.habitsOnTrack }}
            </span>
            <span class="text-xs text-gray-400">/ {{ habits.length }}</span>
          </div>
        </div>

        <!-- Habits Struggling -->
        <div class="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <span class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Struggling (&lt;50%)
          </span>
          <div class="mt-2 flex items-baseline gap-1.5">
            <span class="text-2xl sm:text-3xl font-bold text-amber-600 dark:text-amber-400">
              {{ overallSummary.habitsStruggling }}
            </span>
            <span class="text-xs text-gray-400">/ {{ habits.length }}</span>
          </div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Stacked Bar Chart: Weekly Performance -->
        <div class="bg-white dark:bg-gray-900 p-5 sm:p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div class="mb-4">
            <h2 class="text-base font-semibold text-gray-900 dark:text-white">
              Weekly Performance (Last 12 Weeks)
            </h2>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Completed vs missed days per week
            </p>
          </div>
          <div class="h-64 sm:h-72">
            <Bar :data="weeklyChartData" :options="weeklyChartOptions" />
          </div>
        </div>

        <!-- Bar Chart: Day of Week Completion Rate -->
        <div class="bg-white dark:bg-gray-900 p-5 sm:p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div class="mb-4">
            <h2 class="text-base font-semibold text-gray-900 dark:text-white">
              Completion by Day of the Week
            </h2>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Consistency by weekday over the last 90 days
            </p>
          </div>
          <div class="h-64 sm:h-72">
            <Bar :data="dayOfWeekChartData" :options="dayOfWeekChartOptions" />
          </div>
        </div>
      </div>

      <!-- Per-Habit Breakdown Table -->
      <div class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div class="p-5 sm:p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 class="text-base font-semibold text-gray-900 dark:text-white">
            Habit Breakdown
          </h2>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Completion rates and streaks per habit
          </p>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm" role="table">
            <thead class="bg-gray-50 dark:bg-gray-800/60 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
              <tr>
                <th scope="col" class="py-3.5 px-4 sm:px-6">Habit</th>
                <th scope="col" class="py-3.5 px-4 text-center">7 Days</th>
                <th scope="col" class="py-3.5 px-4 text-center">30 Days</th>
                <th scope="col" class="py-3.5 px-4 text-center">90 Days</th>
                <th scope="col" class="py-3.5 px-4 text-center">Current</th>
                <th scope="col" class="py-3.5 px-4 sm:px-6 text-center">Best</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-800">
              <tr
                v-for="stat in perHabitStats"
                :key="stat.habitId"
                class="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                :class="{
                  'bg-indigo-50/30 dark:bg-indigo-950/20 font-medium':
                    selectedHabitId === stat.habitId,
                }"
              >
                <!-- Habit Name & Emoji -->
                <td class="py-3.5 px-4 sm:px-6 flex items-center gap-2.5">
                  <span class="text-xl">{{ stat.emoji }}</span>
                  <div class="truncate max-w-[140px] sm:max-w-xs">
                    <span class="text-gray-900 dark:text-white font-medium block truncate">
                      {{ stat.name }}
                    </span>
                    <span v-if="stat.isDemo" class="text-[10px] text-indigo-500 uppercase tracking-wider">
                      Demo
                    </span>
                  </div>
                </td>

                <!-- 7 Days -->
                <td class="py-3.5 px-4 text-center">
                  <span
                    class="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
                    :class="
                      stat.rate7 >= 70
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                        : stat.rate7 >= 40
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                          : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                    "
                  >
                    {{ stat.rate7 }}%
                  </span>
                </td>

                <!-- 30 Days -->
                <td class="py-3.5 px-4 text-center">
                  <span
                    class="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
                    :class="
                      stat.rate30 >= 70
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                        : stat.rate30 >= 40
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                          : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                    "
                  >
                    {{ stat.rate30 }}%
                  </span>
                </td>

                <!-- 90 Days -->
                <td class="py-3.5 px-4 text-center text-gray-600 dark:text-gray-300 font-medium">
                  {{ stat.rate90 }}%
                </td>

                <!-- Current Streak -->
                <td class="py-3.5 px-4 text-center">
                  <span class="text-gray-900 dark:text-white font-semibold">
                    {{ stat.currentStreak }}d
                  </span>
                </td>

                <!-- Best Streak -->
                <td class="py-3.5 px-4 sm:px-6 text-center">
                  <span class="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold">
                    {{ stat.bestStreak }}d
                    <span class="text-xs">🔥</span>
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>
