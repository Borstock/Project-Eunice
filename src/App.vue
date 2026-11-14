<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { RouterView } from 'vue-router'
import AppNavbar from '@/components/layout/AppNavbar.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import MigrationModal from '@/components/common/MigrationModal.vue'
import { useHabitStore } from '@/stores/habitStore'
import { useAuthStore } from '@/stores/authStore'
import { useSettingsStore } from '@/stores/settingsStore'

const authStore = useAuthStore()
const habitStore = useHabitStore()
const settingsStore = useSettingsStore()

onMounted(async () => {
  await settingsStore.initTheme()
  if (!authStore.isInitialized) {
    await authStore.initialize()
  }
  await habitStore.initStore()
})

// React dynamically to authentication state changes (login, logout, session restoration)
watch(
  () => authStore.user?.id,
  async (newUserId, oldUserId) => {
    if (newUserId !== oldUserId && authStore.isInitialized) {
      await habitStore.initStore()
    }
  }
)
</script>

<template>
  <div
    class="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100 flex flex-col font-sans transition-colors duration-200"
  >
    <AppNavbar />
    <div class="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <RouterView />
    </div>
    <AppFooter />
    <MigrationModal />
  </div>
</template>
