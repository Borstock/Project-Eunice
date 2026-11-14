/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, any>
  export default component
}

/** Augment Vite's ImportMetaEnv with the project's own VITE_ variables. */
interface ImportMetaEnv {
  /** Display name of the application (default: "Habit Tracker"). */
  readonly VITE_APP_NAME?: string
  /** localStorage key namespace prefix (default: "habit_tracker_"). */
  readonly VITE_STORAGE_PREFIX?: string
  /** Enable verbose debug logging ("true" / "false", default: "false"). */
  readonly VITE_ENABLE_DEBUG?: string
  /** Supabase project URL (e.g. https://xyz.supabase.co). */
  readonly VITE_SUPABASE_URL?: string
  /** Supabase public anonymous API key. */
  readonly VITE_SUPABASE_ANON_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
