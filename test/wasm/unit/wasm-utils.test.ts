/**
 * Unit tests for WASM utility functions
 */

import { describe, it, expect, vi } from 'vitest';
import { safeWarn, encodeParams, isValidUrl } from '../../../src/wasm-utils.js';

describe('WASM Utilities', () => {
  describe('safeWarn', () => {
    it('should call console.warn when available', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      safeWarn('test message');
      
      expect(warnSpy).toHaveBeenCalledWith('test message');
      warnSpy.mockRestore();
    });

    it('should not throw when console.warn is unavailable', () => {
      const originalWarn = console.warn;
      delete (console as any).warn;
      
      expect(() => {
        safeWarn('test message');
      }).not.toThrow();
      
      console.warn = originalWarn;
    });
  });

  describe('encodeParams', () => {
    it('should encode simple parameters', () => {
      const params = { key: 'value', foo: 'bar' };
      const result = encodeParams(params);
      
      expect(result).toContain('key=value');
      expect(result).toContain('foo=bar');
    });

    it('should handle special characters', () => {
      const params = { query: 'hello world', symbol: '&=?' };
      const result = encodeParams(params);
      
      expect(result).toContain('query=hello+world');
      expect(result).toContain('symbol=%26%3D%3F');
    });

    it('should skip undefined and null values', () => {
      const params = { 
        valid: 'value',
        nullValue: null,
        undefinedValue: undefined,
        emptyString: ''
      };
      const result = encodeParams(params);
      
      expect(result).toContain('valid=value');
      expect(result).toContain('emptyString=');
      expect(result).not.toContain('nullValue');
      expect(result).not.toContain('undefinedValue');
    });

    it('should convert numbers to strings', () => {
      const params = { 
        count: 42,
        price: 19.99,
        zero: 0
      };
      const result = encodeParams(params);
      
      expect(result).toContain('count=42');
      expect(result).toContain('price=19.99');
      expect(result).toContain('zero=0');
    });

    it('should handle boolean values', () => {
      const params = { 
        enabled: true,
        disabled: false
      };
      const result = encodeParams(params);
      
      expect(result).toContain('enabled=true');
      expect(result).toContain('disabled=false');
    });

    it('should handle arrays by joining', () => {
      const params = { 
        tags: ['action', 'adventure'],
        ids: [1, 2, 3]
      };
      const result = encodeParams(params);
      
      expect(result).toContain('tags=action%2Cadventure');
      expect(result).toContain('ids=1%2C2%2C3');
    });
  });

  describe('isValidUrl', () => {
    it('should validate HTTP URLs', () => {
      expect(isValidUrl('http://example.com')).toBe(true);
      expect(isValidUrl('https://api.steampowered.com')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('')).toBe(false);
      expect(isValidUrl('ftp://example.com')).toBe(false);
    });

    it('should handle URLs with paths and query parameters', () => {
      expect(isValidUrl('https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=123')).toBe(true);
    });
  });
}); 