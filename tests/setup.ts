if (typeof globalThis.WebSocket === 'undefined') {
  // happy-dom test environment does not provide native WebSocket.
  // Stub a minimal constructor so Supabase client initializes in headless tests.
  // @ts-expect-error Stub minimal WebSocket constructor for tests
  globalThis.WebSocket = class MockWebSocket {}
}
