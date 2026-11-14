import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('supabase client module', () => {
  beforeEach(() => {
    vi.resetModules()
    if (typeof globalThis.WebSocket === 'undefined') {
      // happy-dom test environment does not include WebSocket by default
      // @ts-expect-error stub minimal WebSocket for test environment
      globalThis.WebSocket = class MockWebSocket {}
    }
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('exports null client and throws on getSupabase() when unconfigured', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '')

    const { supabase, getSupabase } = await import('@/services/supabase/client')
    expect(supabase).toBeNull()
    expect(() => getSupabase()).toThrowError(/not configured/)
  })

  it('instantiates client and returns it from getSupabase() when configured', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test-project.supabase.co')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key-abc')

    const { supabase, getSupabase } = await import('@/services/supabase/client')
    expect(supabase).not.toBeNull()
    expect(getSupabase()).toBe(supabase)
    expect(typeof supabase?.auth?.signUp).toBe('function')
  })
})
