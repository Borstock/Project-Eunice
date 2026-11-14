import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import type { User, Session } from '@supabase/supabase-js'
import { useAuthStore } from '@/stores/authStore'

// Mock Supabase client
const mockGetSession = vi.fn()
const mockOnAuthStateChange = vi.fn()
const mockSignUp = vi.fn()
const mockSignInWithPassword = vi.fn()
const mockSignOut = vi.fn()
const mockResetPasswordForEmail = vi.fn()
const mockUpdateUser = vi.fn()

const mockUnsubscribe = vi.fn()

vi.mock('@/services/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
      onAuthStateChange: (...args: unknown[]) => mockOnAuthStateChange(...args),
      signUp: (...args: unknown[]) => mockSignUp(...args),
      signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
      signOut: (...args: unknown[]) => mockSignOut(...args),
      resetPasswordForEmail: (...args: unknown[]) => mockResetPasswordForEmail(...args),
      updateUser: (...args: unknown[]) => mockUpdateUser(...args)
    }
  }
}))

vi.mock('@/config/env', () => ({
  IS_SUPABASE_CONFIGURED: true,
  APP_NAME: 'Habit Tracker'
}))

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()

    mockOnAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: mockUnsubscribe
        }
      }
    })
  })

  describe('initialize()', () => {
    it('restores active session if present', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' }
      const mockSession = { user: mockUser, access_token: 'token-123' }
      mockGetSession.mockResolvedValueOnce({
        data: { session: mockSession },
        error: null
      })

      const store = useAuthStore()
      await store.initialize()

      expect(store.isInitialized).toBe(true)
      expect(store.loading).toBe(false)
      expect(store.user).toEqual(mockUser)
      expect(store.session).toEqual(mockSession)
      expect(store.isAuthenticated).toBe(true)
      expect(store.userEmail).toBe('test@example.com')
    })

    it('handles initialization when no session exists', async () => {
      mockGetSession.mockResolvedValueOnce({
        data: { session: null },
        error: null
      })

      const store = useAuthStore()
      await store.initialize()

      expect(store.isInitialized).toBe(true)
      expect(store.loading).toBe(false)
      expect(store.user).toBeNull()
      expect(store.session).toBeNull()
      expect(store.isAuthenticated).toBe(false)
      expect(store.userEmail).toBeNull()
    })

    it('handles getSession error gracefully', async () => {
      mockGetSession.mockResolvedValueOnce({
        data: { session: null },
        error: new Error('Failed to fetch')
      })

      const store = useAuthStore()
      await store.initialize()

      expect(store.isInitialized).toBe(true)
      expect(store.error).toContain('Unable to connect')
    })
  })

  describe('signUp()', () => {
    it('handles successful sign up requiring email confirmation', async () => {
      mockSignUp.mockResolvedValueOnce({
        data: { user: { id: 'u-1', email: 'new@example.com' }, session: null },
        error: null
      })

      const store = useAuthStore()
      const result = await store.signUp('new@example.com', 'password123')

      expect(result.success).toBe(true)
      expect(result.needsEmailConfirmation).toBe(true)
      expect(store.error).toBeNull()
    })

    it('handles successful sign up with immediate session', async () => {
      const mockUser = { id: 'u-1', email: 'new@example.com' }
      const mockSession = { user: mockUser, access_token: 'tok' }
      mockSignUp.mockResolvedValueOnce({
        data: { user: mockUser, session: mockSession },
        error: null
      })

      const store = useAuthStore()
      const result = await store.signUp('new@example.com', 'password123')

      expect(result.success).toBe(true)
      expect(result.needsEmailConfirmation).toBe(false)
      expect(store.user).toEqual(mockUser)
    })

    it('handles sign up errors', async () => {
      mockSignUp.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: new Error('User already registered')
      })

      const store = useAuthStore()
      const result = await store.signUp('existing@example.com', 'password123')

      expect(result.success).toBe(false)
      expect(result.error).toContain('account with this email already exists')
      expect(store.error).toContain('account with this email already exists')
    })
  })

  describe('signIn()', () => {
    it('handles successful sign in', async () => {
      const mockUser = { id: 'u-1', email: 'user@example.com' }
      const mockSession = { user: mockUser, access_token: 'tok-abc' }
      mockSignInWithPassword.mockResolvedValueOnce({
        data: { user: mockUser, session: mockSession },
        error: null
      })

      const store = useAuthStore()
      const result = await store.signIn('user@example.com', 'password123')

      expect(result.success).toBe(true)
      expect(store.user).toEqual(mockUser)
      expect(store.session).toEqual(mockSession)
      expect(store.isAuthenticated).toBe(true)
    })

    it('handles sign in credentials error', async () => {
      mockSignInWithPassword.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: new Error('Invalid login credentials')
      })

      const store = useAuthStore()
      const result = await store.signIn('user@example.com', 'wrongpassword')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid email or password')
      expect(store.error).toContain('Invalid email or password')
      expect(store.isAuthenticated).toBe(false)
    })
  })

  describe('signOut()', () => {
    it('clears session and user data on successful sign out', async () => {
      mockSignOut.mockResolvedValueOnce({ error: null })

      const store = useAuthStore()
      store.user = { id: 'u-1', email: 'user@example.com' } as unknown as User
      store.session = { access_token: 'tok' } as unknown as Session

      // Set item in localStorage to check cleanup
      localStorage.setItem('sb-test-auth-token', 'secret')
      localStorage.setItem('habit_tracker_cloud_cache', 'cache')

      const result = await store.signOut()

      expect(result.success).toBe(true)
      expect(store.user).toBeNull()
      expect(store.session).toBeNull()
      expect(store.isAuthenticated).toBe(false)
      expect(localStorage.getItem('sb-test-auth-token')).toBeNull()
      expect(localStorage.getItem('habit_tracker_cloud_cache')).toBeNull()
    })

    it('handles sign out failure', async () => {
      mockSignOut.mockResolvedValueOnce({ error: new Error('Signout failed') })

      const store = useAuthStore()
      const result = await store.signOut()

      expect(result.success).toBe(false)
      expect(store.error).toBe('Signout failed')
    })
  })

  describe('resetPasswordForEmail()', () => {
    it('requests reset email successfully', async () => {
      mockResetPasswordForEmail.mockResolvedValueOnce({ error: null })

      const store = useAuthStore()
      const result = await store.resetPasswordForEmail('user@example.com')

      expect(result.success).toBe(true)
      expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
        'user@example.com',
        expect.objectContaining({ redirectTo: expect.stringContaining('/reset-password') })
      )
    })

    it('handles reset password errors', async () => {
      mockResetPasswordForEmail.mockResolvedValueOnce({
        error: Object.assign(new Error('rate limit exceeded'), { status: 429 })
      })

      const store = useAuthStore()
      const result = await store.resetPasswordForEmail('user@example.com')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Too many attempts')
    })
  })

  describe('updatePassword()', () => {
    it('updates password successfully', async () => {
      mockUpdateUser.mockResolvedValueOnce({
        data: { user: { id: 'u-1' } },
        error: null
      })

      const store = useAuthStore()
      store.passwordRecoveryActive = true
      const result = await store.updatePassword('newSecurePassword123')

      expect(result.success).toBe(true)
      expect(store.passwordRecoveryActive).toBe(false)
      expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'newSecurePassword123' })
    })

    it('handles update password error', async () => {
      mockUpdateUser.mockResolvedValueOnce({
        data: { user: null },
        error: new Error('Password should be at least 6 characters')
      })

      const store = useAuthStore()
      const result = await store.updatePassword('123')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Password must be at least 6 characters')
    })
  })
})
