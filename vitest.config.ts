/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // WASM environment simulation
    environment: 'jsdom',
    
    // Global test setup
    globals: true,
    
    // Test file patterns
    include: [
      'test/wasm/**/*.test.ts',
      'test/wasm/**/*.spec.ts',
      'test/**/*.test.ts'
    ],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'src/**/*.d.ts'
      ]
    },
    
    // Test timeout for API calls
    testTimeout: 10000,
    
    // Setup files
    setupFiles: ['./test/wasm/setup.ts']
  },
  
  // Define for environment detection
  define: {
    __TEST_ENV__: '"wasm"'
  }
}); 