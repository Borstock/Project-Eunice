/**
 * env.ts – single source of truth for all environment variables.
 *
 * Rules:
 *  - Every consumer imports from HERE, never from `import.meta.env` directly.
 *  - Variables are validated and given safe defaults so the app never crashes
 *    on a missing or malformed value.
 *  - All VITE_ variables are compiled into the browser bundle and therefore
 *    publicly visible. NEVER store secrets here.
 */

/** Raw env access is isolated to this function so it can be overridden in tests. */
function getRaw(key: string): string | undefined {
  // In a Vite browser build `import.meta.env` is statically replaced.
  // In Vitest the same object is available through the `vite` test runner.
  return (import.meta.env as Record<string, string | undefined>)[key]
}

// ---------------------------------------------------------------------------
// VITE_APP_NAME
// ---------------------------------------------------------------------------
const rawAppName = getRaw('VITE_APP_NAME')
export const APP_NAME: string =
  rawAppName && rawAppName.trim().length > 0 ? rawAppName.trim() : 'Habit Tracker'

// ---------------------------------------------------------------------------
// VITE_STORAGE_PREFIX
// ---------------------------------------------------------------------------
const rawStoragePrefix = getRaw('VITE_STORAGE_PREFIX')

/** Validates that a storage prefix is a non-empty safe string (alphanum + _ -). */
function isValidPrefix(value: string | undefined): value is string {
  return typeof value === 'string' && /^[a-zA-Z0-9_-]+$/.test(value)
}

export const STORAGE_PREFIX: string = isValidPrefix(rawStoragePrefix)
  ? rawStoragePrefix
  : 'habit_tracker_'

/**
 * Legacy prefix used before env-config was introduced.
 * On first boot the storage layer migrates data from this key to the active prefix.
 */
export const LEGACY_STORAGE_PREFIX = 'habit_tracker_'

// ---------------------------------------------------------------------------
// VITE_ENABLE_DEBUG
// ---------------------------------------------------------------------------
const rawDebug = getRaw('VITE_ENABLE_DEBUG')
export const ENABLE_DEBUG: boolean = rawDebug?.toLowerCase() === 'true'

// ---------------------------------------------------------------------------
// VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY
// ---------------------------------------------------------------------------
const rawSupabaseUrl = getRaw('VITE_SUPABASE_URL')
export const SUPABASE_URL: string = rawSupabaseUrl?.trim() || ''

const rawSupabaseAnonKey = getRaw('VITE_SUPABASE_ANON_KEY')
export const SUPABASE_ANON_KEY: string = rawSupabaseAnonKey?.trim() || ''

export const IS_SUPABASE_CONFIGURED: boolean = Boolean(SUPABASE_URL) && Boolean(SUPABASE_ANON_KEY)

// ---------------------------------------------------------------------------
// Frozen config object (convenient single import)
// ---------------------------------------------------------------------------
export const appConfig = Object.freeze({
  APP_NAME,
  STORAGE_PREFIX,
  LEGACY_STORAGE_PREFIX,
  ENABLE_DEBUG,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  IS_SUPABASE_CONFIGURED
} as const)

export type AppConfig = typeof appConfig
