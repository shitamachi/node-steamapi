/**
 * WASM environment test setup
 * Configures the testing environment to simulate WASM conditions
 */

import { beforeAll, beforeEach } from 'vitest';

// Mock WASM environment
beforeAll(() => {
  // Ensure WebAssembly is available in test environment
  if (typeof globalThis.WebAssembly === 'undefined') {
    class MockWebAssemblyModule {}
    class MockWebAssemblyInstance {}
    
    globalThis.WebAssembly = {
      Module: MockWebAssemblyModule,
      Instance: MockWebAssemblyInstance,
      compile: () => Promise.resolve(new MockWebAssemblyModule()),
      instantiate: () => Promise.resolve({ 
        module: new MockWebAssemblyModule(), 
        instance: new MockWebAssemblyInstance() 
      })
    } as any;
  }

  // Ensure fetch is available
  if (typeof globalThis.fetch === 'undefined') {
    // Will use jsdom's fetch implementation
    console.log('Using jsdom fetch implementation');
  }

  console.log('🚀 WASM test environment initialized');
});

beforeEach(() => {
  // Reset any mocks or state before each test
  // This ensures test isolation
}); 