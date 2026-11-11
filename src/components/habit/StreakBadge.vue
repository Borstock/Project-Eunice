<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  streak: number
}>()

const badgeLabel = computed(() => {
  if (props.streak === 1) return '1 day'
  return `${props.streak} days`
})
</script>

<template>
  <div
    class="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide transition-colors"
    :class="
      streak > 0
        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300/40 dark:border-amber-700/40'
        : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
    "
    :title="`Current streak: ${streak} days`"
  >
    <span v-if="streak > 0" class="text-xs">🔥</span>
    <span>{{ badgeLabel }}</span>
  </div>
</template>
