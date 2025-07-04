/**
 * Unit tests for version injection and environment detection
 */

import { describe, it, expect } from 'vitest';
import { 
  version, 
  name,
  isWasmEnvironment,
  isBrowserEnvironment,
  isWebWorkerEnvironment,
  isDateApiAvailable,
  safeDateNow
} from '../../../src/version.js';

describe('Version Injection', () => {
  it('should have correct package name', () => {
    expect(name).toBe('steamapi');
  });

  it('should have injected version', () => {
    expect(version).toBeDefined();
    expect(version).not.toBe('UNKNOWN');
    expect(typeof version).toBe('string');
  });

  it('should follow semantic versioning format', () => {
    const semverRegex = /^\d+\.\d+\.\d+(-[\w\.-]+)?(\+[\w\.-]+)?$/;
    expect(version).toMatch(semverRegex);
  });
});

describe('Environment Detection (Web/WASM Only)', () => {
  it('should detect WASM environment', () => {
    const hasWasm = isWasmEnvironment();
    expect(typeof hasWasm).toBe('boolean');
    // In jsdom environment, WebAssembly should be available
    expect(hasWasm).toBe(true);
  });

  it('should detect browser environment', () => {
    const isBrowser = isBrowserEnvironment();
    expect(typeof isBrowser).toBe('boolean');
    // In jsdom environment, this should be true
    expect(isBrowser).toBe(true);
  });

  it('should detect Web Worker environment', () => {
    const isWebWorker = isWebWorkerEnvironment();
    expect(typeof isWebWorker).toBe('boolean');
    // In jsdom environment, this should be false
    expect(isWebWorker).toBe(false);
  });

  it('should detect Date API availability', () => {
    const hasDate = isDateApiAvailable();
    expect(typeof hasDate).toBe('boolean');
    expect(hasDate).toBe(true); // Should be available in test environment
  });

  it('should provide safe Date.now() implementation', () => {
    const now = safeDateNow();
    expect(typeof now).toBe('number');
    expect(now).toBeGreaterThan(0);
    expect(Number.isInteger(now)).toBe(true);
  });

  it('should handle environments without WebAssembly', () => {
    // Mock scenario where WebAssembly is not available
    const originalWebAssembly = globalThis.WebAssembly;
    // @ts-ignore - intentionally testing undefined scenario
    delete globalThis.WebAssembly;
    
    const hasWasm = isWasmEnvironment();
    expect(hasWasm).toBe(false);
    
    // Restore WebAssembly
    globalThis.WebAssembly = originalWebAssembly;
  });

  it('should handle environments without window/document', () => {
    // Mock scenario for non-browser environment
    const originalWindow = globalThis.window;
    const originalDocument = globalThis.document;
    
    // @ts-ignore - intentionally testing undefined scenario
    delete globalThis.window;
    // @ts-ignore - intentionally testing undefined scenario  
    delete globalThis.document;
    
    const isBrowser = isBrowserEnvironment();
    expect(isBrowser).toBe(false);
    
    // Restore globals
    globalThis.window = originalWindow;
    globalThis.document = originalDocument;
  });
}); 