import { describe, it, expect } from 'vitest'
import { formatAuthError } from '@/utils/authErrors'

describe('formatAuthError', () => {
  it('returns empty string for null or undefined error', () => {
    expect(formatAuthError(null)).toBe('')
    expect(formatAuthError(undefined)).toBe('')
  })

  it('formats invalid login credentials', () => {
    const error = new Error('Invalid login credentials')
    expect(formatAuthError(error)).toContain('Invalid email or password')
  })

  it('formats already registered error', () => {
    const error = new Error('User already registered')
    expect(formatAuthError(error)).toContain('account with this email already exists')
  })

  it('formats unconfirmed email error', () => {
    const error = new Error('Email not confirmed')
    expect(formatAuthError(error)).toContain('Please confirm your email address')
  })

  it('formats short / weak password error', () => {
    const error = new Error('Password should be at least 6 characters')
    expect(formatAuthError(error)).toContain('Password must be at least 6 characters')
  })

  it('formats rate limit error', () => {
    const error = Object.assign(new Error('rate limit reached'), { status: 429 })
    expect(formatAuthError(error)).toContain('Too many attempts')
  })

  it('formats network failure error', () => {
    const error = new Error('Failed to fetch')
    expect(formatAuthError(error)).toContain('Unable to connect to the authentication server')
  })

  it('falls back to custom message or generic fallback', () => {
    const error = new Error('Some custom message')
    expect(formatAuthError(error)).toBe('Some custom message')

    const emptyError = new Error('')
    expect(formatAuthError(emptyError)).toBe(
      'An unexpected authentication error occurred. Please try again.'
    )
  })
})
