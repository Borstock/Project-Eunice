import { defineStore } from 'pinia'
import type { User, Session, Subscription } from '@supabase/supabase-js'
import { supabase } from '@/services/supabase/client'
import { IS_SUPABASE_CONFIGURED } from '@/config/env'
import { formatAuthError } from '@/utils/authErrors'

export interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
  isInitialized: boolean
  passwordRecoveryActive: boolean
}

let authSubscription: Subscription | null = null

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    session: null,
    loading: false,
    error: null,
    isInitialized: false,
    passwordRecoveryActive: false
  }),

  getters: {
    isAuthenticated: (state): boolean => Boolean(state.user),
    userEmail: (state): string | null => state.user?.email ?? null,
    isConfigured: (): boolean => IS_SUPABASE_CONFIGURED && Boolean(supabase)
  },

  actions: {
    async initialize(): Promise<void> {
      if (this.isInitialized) return

      if (!this.isConfigured || !supabase) {
        this.loading = false
        this.isInitialized = true
        return
      }

      this.loading = true
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) {
          this.error = formatAuthError(error)
        } else {
          this.session = data.session
          this.user = data.session?.user ?? null
        }

        // Set up reactive auth state change listener if not already subscribed
        if (!authSubscription) {
          const { data: subData } = supabase.auth.onAuthStateChange((event, session) => {
            this.session = session
            this.user = session?.user ?? null

            if (event === 'PASSWORD_RECOVERY') {
              this.passwordRecoveryActive = true
            }

            if (event === 'SIGNED_OUT') {
              this.user = null
              this.session = null
              this.passwordRecoveryActive = false
            }
          })
          authSubscription = subData.subscription
        }
      } catch (err) {
        this.error = formatAuthError(err as Error)
      } finally {
        this.loading = false
        this.isInitialized = true
      }
    },

    async signUp(
      email: string,
      password: string
    ): Promise<{ success: boolean; needsEmailConfirmation?: boolean; error?: string }> {
      this.error = null
      if (!this.isConfigured || !supabase) {
        const msg = 'Authentication service is not configured.'
        this.error = msg
        return { success: false, error: msg }
      }

      this.loading = true
      try {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password
        })

        if (error) {
          this.error = formatAuthError(error)
          return { success: false, error: this.error }
        }

        this.user = data.user
        this.session = data.session
        const needsEmailConfirmation = !data.session && Boolean(data.user)

        return { success: true, needsEmailConfirmation }
      } catch (err) {
        this.error = formatAuthError(err as Error)
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
      this.error = null
      if (!this.isConfigured || !supabase) {
        const msg = 'Authentication service is not configured.'
        this.error = msg
        return { success: false, error: msg }
      }

      this.loading = true
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password
        })

        if (error) {
          this.error = formatAuthError(error)
          return { success: false, error: this.error }
        }

        this.user = data.user
        this.session = data.session
        return { success: true }
      } catch (err) {
        this.error = formatAuthError(err as Error)
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async signOut(): Promise<{ success: boolean; error?: string }> {
      this.error = null
      if (!this.isConfigured || !supabase) {
        this.user = null
        this.session = null
        return { success: true }
      }

      this.loading = true
      try {
        const { error } = await supabase.auth.signOut()
        if (error) {
          this.error = formatAuthError(error)
          return { success: false, error: this.error }
        }

        this.user = null
        this.session = null
        this.passwordRecoveryActive = false

        // Clear cached user data key if present
        if (typeof window !== 'undefined' && window.localStorage) {
          // Removes any session/cloud cached items
          const keysToRemove: string[] = []
          for (let i = 0; i < window.localStorage.length; i++) {
            const key = window.localStorage.key(i)
            if (key && (key.includes('sb-') || key.includes('cloud_cache'))) {
              keysToRemove.push(key)
            }
          }
          keysToRemove.forEach((k) => window.localStorage.removeItem(k))
        }

        return { success: true }
      } catch (err) {
        this.error = formatAuthError(err as Error)
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async resetPasswordForEmail(email: string): Promise<{ success: boolean; error?: string }> {
      this.error = null
      if (!this.isConfigured || !supabase) {
        const msg = 'Authentication service is not configured.'
        this.error = msg
        return { success: false, error: msg }
      }

      this.loading = true
      try {
        const redirectTo =
          typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : undefined

        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo
        })

        if (error) {
          this.error = formatAuthError(error)
          return { success: false, error: this.error }
        }

        return { success: true }
      } catch (err) {
        this.error = formatAuthError(err as Error)
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
      this.error = null
      if (!this.isConfigured || !supabase) {
        const msg = 'Authentication service is not configured.'
        this.error = msg
        return { success: false, error: msg }
      }

      this.loading = true
      try {
        const { error } = await supabase.auth.updateUser({
          password: newPassword
        })

        if (error) {
          this.error = formatAuthError(error)
          return { success: false, error: this.error }
        }

        this.passwordRecoveryActive = false
        return { success: true }
      } catch (err) {
        this.error = formatAuthError(err as Error)
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    clearError(): void {
      this.error = null
    },

    /** Resets the auth store state (useful for test isolation). */
    $reset(): void {
      this.user = null
      this.session = null
      this.loading = false
      this.error = null
      this.isInitialized = false
      this.passwordRecoveryActive = false
      if (authSubscription) {
        authSubscription.unsubscribe()
        authSubscription = null
      }
    }
  }
})
