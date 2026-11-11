<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { Habit } from '@/models/habit'

const props = defineProps<{
  isOpen: boolean
  habitToEdit?: Habit | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', payload: { name: string; emoji: string; color: string }): void
}>()

const PRESET_EMOJIS = ['💧', '🏃', '📚', '🧘', '💻', '🥗', '💊', '💤', '🚴', '🎨', '✍️', '🎸']
const PRESET_COLORS = [
  '#4f46e5', // Indigo
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red / Rose
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#3b82f6' // Blue
]

const name = ref('')
const selectedEmoji = ref('🎯')
const selectedColor = ref('#4f46e5')
const errorMessage = ref('')

const isEditing = computed(() => !!props.habitToEdit)

watch(
  () => props.habitToEdit,
  (habit) => {
    if (habit) {
      name.value = habit.name
      selectedEmoji.value = habit.emoji
      selectedColor.value = habit.color
    } else {
      resetForm()
    }
  },
  { immediate: true }
)

function resetForm() {
  name.value = ''
  selectedEmoji.value = '🎯'
  selectedColor.value = '#4f46e5'
  errorMessage.value = ''
}

function handleClose() {
  resetForm()
  emit('close')
}

function handleSubmit() {
  const trimmed = name.value.trim()
  if (!trimmed) {
    errorMessage.value = 'Please enter a habit name.'
    return
  }
  if (trimmed.length > 50) {
    errorMessage.value = 'Habit name must be 50 characters or less.'
    return
  }

  emit('save', {
    name: trimmed,
    emoji: selectedEmoji.value,
    color: selectedColor.value
  })

  handleClose()
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm transition-opacity"
    @click.self="handleClose"
  >
    <div
      class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-800 transform transition-all"
    >
      <div
        class="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800"
      >
        <h3 class="text-xl font-bold text-gray-900 dark:text-white">
          {{ isEditing ? 'Edit Habit' : 'Create New Habit' }}
        </h3>
        <button
          type="button"
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg"
          @click="handleClose"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <form class="mt-5 space-y-5" @submit.prevent="handleSubmit">
        <!-- Habit Name -->
        <div>
          <label
            for="habit-name"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Habit Name
          </label>
          <input
            id="habit-name"
            v-model="name"
            type="text"
            placeholder="e.g. Morning Jog, Drink 2L Water"
            maxlength="50"
            class="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
          />
          <p v-if="errorMessage" class="text-xs text-rose-500 mt-1.5">{{ errorMessage }}</p>
        </div>

        <!-- Emoji Picker -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Icon / Emoji
          </label>
          <div class="grid grid-cols-6 gap-2">
            <button
              v-for="emoji in PRESET_EMOJIS"
              :key="emoji"
              type="button"
              class="w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all"
              :class="
                selectedEmoji === emoji
                  ? 'bg-indigo-100 dark:bg-indigo-950/80 ring-2 ring-indigo-500 scale-105'
                  : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
              "
              @click="selectedEmoji = emoji"
            >
              {{ emoji }}
            </button>
          </div>
        </div>

        <!-- Color Palette -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Color
          </label>
          <div class="flex flex-wrap gap-2.5">
            <button
              v-for="color in PRESET_COLORS"
              :key="color"
              type="button"
              class="w-8 h-8 rounded-full transition-all focus:outline-none"
              :style="{ backgroundColor: color }"
              :class="
                selectedColor === color
                  ? 'ring-4 ring-offset-2 ring-indigo-500 dark:ring-offset-gray-900 scale-110'
                  : 'hover:scale-105'
              "
              :title="color"
              @click="selectedColor = color"
            />
          </div>
        </div>

        <!-- Actions -->
        <div
          class="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-gray-800"
        >
          <button
            type="button"
            class="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            @click="handleClose"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-md shadow-indigo-500/20 transition-colors"
          >
            {{ isEditing ? 'Save Changes' : 'Create Habit' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
