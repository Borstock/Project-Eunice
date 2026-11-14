import type { AuthError } from '@supabase/supabase-js'

/**
 * Translates Supabase authentication error codes and messages into
 * friendly, user-facing error messages.
 */
export function formatAuthError(error: AuthError | Error | null | undefined): string {
  if (!error) return ''

  const message = error.message || ''
  const status = 'status' in error ? error.status : undefined

  // Invalid login credentials
  if (
    message.includes('Invalid login credentials') ||
    message.includes('invalid_grant') ||
    message.includes('invalid_credentials')
  ) {
    return 'Invalid email or password. Please check your credentials and try again.'
  }

  // User already exists
  if (
    message.includes('User already registered') ||
    message.includes('user_already_exists') ||
    message.includes('already registered')
  ) {
    return 'An account with this email already exists. Try logging in instead.'
  }

  // Unconfirmed email
  if (message.includes('Email not confirmed') || message.includes('email_not_confirmed')) {
    return 'Please confirm your email address before logging in. Check your inbox for the confirmation link.'
  }

  // Weak password
  if (
    message.includes('Password should be at least') ||
    message.includes('weak_password') ||
    message.includes('password is too short')
  ) {
    return 'Password must be at least 6 characters long.'
  }

  // Rate limits
  if (
    status === 429 ||
    message.includes('rate limit') ||
    message.includes('too many requests') ||
    message.includes('over_request_rate_limit') ||
    message.includes('over_email_send_rate_limit')
  ) {
    return 'Too many attempts. Please wait a few moments before trying again.'
  }

  // Network or offline issues
  if (
    message.includes('Failed to fetch') ||
    message.includes('NetworkError') ||
    message.includes('network')
  ) {
    return 'Unable to connect to the authentication server. Please check your internet connection.'
  }

  // Fallback to provided message or generic fallback
  return message || 'An unexpected authentication error occurred. Please try again.'
}
