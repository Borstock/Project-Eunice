<script setup lang="ts">
import { ref } from 'vue'
import { useHabitStore } from '@/stores/habitStore'
import type { Habit } from '@/models/habit'
import HabitFormModal from '@/components/habit/HabitFormModal.vue'
import HabitDeleteDialog from '@/components/habit/HabitDeleteDialog.vue'

const habitStore = useHabitStore()

const isFormModalOpen = ref(false)
const isDeleteDialogOpen = ref(false)
const selectedHabit = ref<Habit | null>(null)

function openCreateModal() {
  selectedHabit.value = null
  isFormModalOpen.value = true
}

function openEditModal(habit: Habit) {
  selectedHabit.value = { ...habit }
  isFormModalOpen.value = true
}

function openDeleteModal(habit: Habit) {
  selectedHabit.value = habit
  isDeleteDialogOpen.value = true
}

function handleSaveHabit(payload: { name: string; emoji: string; color: string }) {
  if (selectedHabit.value) {
    habitStore.updateHabit(selectedHabit.value.id, payload)
  } else {
    habitStore.createHabit(payload)
  }
}

function handleConfirmDelete() {
  if (selectedHabit.value) {
    habitStore.deleteHabit(selectedHabit.value.id)
    selectedHabit.value = null
    isDeleteDialogOpen.value = false
  }
}
</script>

<template>
  <div class="space-y-6 max-w-2xl mx-auto">
    <!-- Header with Add Habit Button -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Manage Habits
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Customize, re-order, edit or remove your habits.
        </p>
      </div>

      <button
        type="button"
        class="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-sm shadow-indigo-500/20 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        @click="openCreateModal"
      >
        <span class="text-base leading-none">+</span>
        <span>New Habit</span>
      </button>
    </div>

    <!-- Empty State -->
    <div
      v-if="habitStore.activeHabits.length === 0"
      class="text-center py-16 px-4 bg-white dark:bg-gray-900/50 rounded-2xl border border-dashed border-gray-300 dark:border-gray-800 shadow-sm"
    >
      <div
        class="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-3xl mb-4"
      >
        ✨
      </div>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">No habits yet</h3>
      <p class="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-1 mb-6">
        Start building a better daily routine today. Create your first habit in seconds.
      </p>
      <button
        type="button"
        class="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 transition-all"
        @click="openCreateModal"
      >
        Create your first habit
      </button>
    </div>

    <!-- Habit List -->
    <div v-else class="space-y-3">
      <div
        v-for="habit in habitStore.activeHabits"
        :key="habit.id"
        class="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow"
      >
        <div class="flex items-center space-x-3.5 min-w-0">
          <div
            class="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-inner"
            :style="{ backgroundColor: `${habit.color}1a` }"
          >
            <span>{{ habit.emoji }}</span>
          </div>
          <div class="truncate">
            <h4 class="font-semibold text-gray-900 dark:text-white text-base truncate">
              {{ habit.name }}
            </h4>
            <div
              class="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5"
            >
              <span
                class="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                :style="{ backgroundColor: habit.color }"
              />
              <span>Streak: {{ habitStore.getStreak(habit.id) }} days</span>
            </div>
          </div>
        </div>

        <div class="flex items-center space-x-1 shrink-0 ml-4">
          <button
            type="button"
            class="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Edit habit"
            @click="openEditModal(habit)"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>

          <button
            type="button"
            class="p-2 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Delete habit"
            @click="openDeleteModal(habit)"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <HabitFormModal
      :is-open="isFormModalOpen"
      :habit-to-edit="selectedHabit"
      @close="isFormModalOpen = false"
      @save="handleSaveHabit"
    />

    <HabitDeleteDialog
      :is-open="isDeleteDialogOpen"
      :habit-name="selectedHabit?.name || ''"
      @cancel="isDeleteDialogOpen = false"
      @confirm="handleConfirmDelete"
    />
  </div>
</template>
