/**
 * Compatibility tests for WASM environment
 * Tests environment detection, API availability, and fallback mechanisms
 */

import { describe, it, expect, vi } from 'vitest';
import { 
  isWasmEnvironment,
  isBrowserEnvironment,
  isWebWorkerEnvironment,
  isDateApiAvailable,
  safeDateNow 
} from '../../../src/version.js';
import { safeWarn, encodeParams } from '../../../src/wasm-utils.js';

describe('WASM Environment Compatibility', () => {
  describe('Environment Detection', () => {
    it('should detect WASM environment correctly', () => {
      const hasWasm = isWasmEnvironment();
      expect(typeof hasWasm).toBe('boolean');
      expect(hasWasm).toBe(true); // Should be true in test environment
    });

    it('should handle missing WebAssembly gracefully', () => {
      const originalWebAssembly = globalThis.WebAssembly;
      delete (globalThis as any).WebAssembly;
      
      expect(isWasmEnvironment()).toBe(false);
      
      globalThis.WebAssembly = originalWebAssembly;
    });

    it('should detect browser environment in jsdom', () => {
      expect(isBrowserEnvironment()).toBe(true);
    });

    it('should detect non-Web Worker environment', () => {
      expect(isWebWorkerEnvironment()).toBe(false);
    });
  });

  describe('Date API Compatibility', () => {
    it('should detect Date API availability', () => {
      expect(isDateApiAvailable()).toBe(true);
    });

    it('should handle missing Date API', () => {
      const originalDate = globalThis.Date;
      delete (globalThis as any).Date;
      
      expect(isDateApiAvailable()).toBe(false);
      expect(safeDateNow()).toBe(1640995200000); // Fallback value
      
      globalThis.Date = originalDate;
    });

    it('should handle broken Date.now()', () => {
      const originalDateNow = Date.now;
      Date.now = () => NaN;
      
      expect(isDateApiAvailable()).toBe(false);
      expect(safeDateNow()).toBe(1640995200000); // Fallback value
      
      Date.now = originalDateNow;
    });
  });

  describe('Console API Compatibility', () => {
    it('should use console.warn when available', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      safeWarn('test message');
      
      expect(warnSpy).toHaveBeenCalledWith('test message');
      warnSpy.mockRestore();
    });

    it('should handle missing console.warn gracefully', () => {
      const originalWarn = console.warn;
      delete (console as any).warn;
      
      expect(() => {
        safeWarn('test message');
      }).not.toThrow();
      
      console.warn = originalWarn;
    });

    it('should handle missing console object gracefully', () => {
      const originalConsole = globalThis.console;
      delete (globalThis as any).console;
      
      expect(() => {
        safeWarn('test message');
      }).not.toThrow();
      
      globalThis.console = originalConsole;
    });
  });

  describe('URLSearchParams Compatibility', () => {
    it('should encode parameters correctly', () => {
      const params = {
        key: 'test-key',
        appid: 440,
        count: 5,
        include_free: true
      };
      
      const encoded = encodeParams(params);
      
      expect(encoded).toContain('key=test-key');
      expect(encoded).toContain('appid=440');
      expect(encoded).toContain('count=5');
      expect(encoded).toContain('include_free=true');
    });

    it('should handle special characters', () => {
      const params = {
        query: 'hello world',
        symbols: '&=?#'
      };
      
      const encoded = encodeParams(params);
      
      expect(encoded).toContain('query=hello+world');
      expect(encoded).toContain('symbols=%26%3D%3F%23');
    });

    it('should work without URLSearchParams polyfill', () => {
      // URLSearchParams should be available in jsdom
      expect(typeof URLSearchParams).toBe('function');
      
      const searchParams = new URLSearchParams();
      searchParams.append('test', 'value');
      expect(searchParams.toString()).toBe('test=value');
    });
  });

  describe('Fetch API Compatibility', () => {
    it('should have fetch available in test environment', () => {
      expect(typeof globalThis.fetch).toBe('function');
    });

    it('should handle fetch in different environments', () => {
      // Test that fetch is properly detected
      const hasFetch = typeof globalThis.fetch !== 'undefined';
      expect(hasFetch).toBe(true);
      
      // Test that self.fetch would also work (Web Worker)
      const hasSelfFetch = typeof self !== 'undefined' && typeof self.fetch !== 'undefined';
      // This might be false in jsdom, which is expected
      expect(typeof hasSelfFetch).toBe('boolean');
    });
  });

  describe('Module System Compatibility', () => {
    it('should support ES modules', () => {
      // Test that we can import modules
      expect(typeof isWasmEnvironment).toBe('function');
      expect(typeof safeWarn).toBe('function');
      expect(typeof encodeParams).toBe('function');
    });

    it('should work in pure Web/WASM environments', () => {
      // Ensure our code works in environments without Node.js features
      // Our code should work even without require() or process
      expect(() => {
        isWasmEnvironment();
        safeWarn('test');
        encodeParams({});
      }).not.toThrow();
    });
  });

  describe('BigInt Support', () => {
    it('should support BigInt for large numbers', () => {
      expect(typeof BigInt).toBe('function');
      
      const largeBigInt = BigInt('76561198006409530');
      expect(largeBigInt.toString()).toBe('76561198006409530');
    });

    it('should handle BigInt arithmetic', () => {
      const base = BigInt('76561197960265728');
      const offset = BigInt('46143802');
      const result = base + offset;
      
      expect(result.toString()).toBe('76561198006409530');
    });
  });

  describe('Error Handling in Constrained Environments', () => {
    it('should handle environments with limited APIs', () => {
      // Test behavior when some APIs are missing
      const results = {
        hasWasm: isWasmEnvironment(),
        isBrowser: isBrowserEnvironment(),
        isWorker: isWebWorkerEnvironment(),
        hasDate: isDateApiAvailable(),
        safeTime: safeDateNow()
      };
      
      // All should return valid values without throwing
      expect(typeof results.hasWasm).toBe('boolean');
      expect(typeof results.isBrowser).toBe('boolean');
      expect(typeof results.isWorker).toBe('boolean');
      expect(typeof results.hasDate).toBe('boolean');
      expect(typeof results.safeTime).toBe('number');
      expect(results.safeTime).toBeGreaterThan(0);
    });

    it('should handle string encoding edge cases', () => {
      const testCases = [
        { input: {}, expected: '' },
        { input: { empty: '' }, expected: 'empty=' },
        { input: { space: ' ' }, expected: 'space=+' },
        { input: { unicode: '测试' }, expected: 'unicode=%E6%B5%8B%E8%AF%95' },
        { input: { special: '!@#$%^&*()' }, expected: 'special=%21%40%23%24%25%5E%26*%28%29' }
      ];
      
      testCases.forEach(({ input, expected }) => {
        const result = encodeParams(input);
        expect(result).toBe(expected);
      });
    });
  });
}); 