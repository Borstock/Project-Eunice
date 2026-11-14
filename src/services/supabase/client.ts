import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY, IS_SUPABASE_CONFIGURED } from '@/config/env'

/**
 * Singleton Supabase client instance.
 * Evaluates to null when VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are not provided,
 * allowing the application to operate seamlessly in offline/guest mode.
 */
export const supabase: SupabaseClient | null = IS_SUPABASE_CONFIGURED
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null

/**
 * Returns the active Supabase client instance.
 * Throws a descriptive error if accessed when credentials are not configured.
 */
export function getSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      'Supabase client is not configured. Please define VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
    )
  }
  return supabase
}
