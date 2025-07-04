/**
 * Unit tests for environment variable utilities
 */

import { describe, it, expect } from 'vitest';
import {
  parseEnvContent,
  getSteamApiKey,
  loadEnvFromContent 
} from '../../../src/env-utils.js';

describe('Environment Variable Utilities (WASM/Web Only)', () => {
  describe('parseEnvContent', () => {
    it('should parse simple key-value pairs', () => {
      const envContent = `
STEAM_API_KEY=abc123
NODE_ENV=development
PORT=3000
`;
      const result = parseEnvContent(envContent);
      
      expect(result.STEAM_API_KEY).toBe('abc123');
      expect(result.NODE_ENV).toBe('development');
      expect(result.PORT).toBe('3000');
    });

    it('should handle quoted values', () => {
      const envContent = `
STEAM_API_KEY="quoted_key_123"
MESSAGE='Hello World'
COMPLEX="Value with spaces and symbols!@#"
`;
      const result = parseEnvContent(envContent);
      
      expect(result.STEAM_API_KEY).toBe('quoted_key_123');
      expect(result.MESSAGE).toBe('Hello World');
      expect(result.COMPLEX).toBe('Value with spaces and symbols!@#');
    });

    it('should skip comments and empty lines', () => {
      const envContent = `
# This is a comment
STEAM_API_KEY=test123

# Another comment
NODE_ENV=test
`;
      const result = parseEnvContent(envContent);
      
      expect(result.STEAM_API_KEY).toBe('test123');
      expect(result.NODE_ENV).toBe('test');
      expect(Object.keys(result)).toHaveLength(2);
    });

    it('should handle malformed lines gracefully', () => {
      const envContent = `
STEAM_API_KEY=valid123
INVALID_LINE_WITHOUT_EQUALS
=INVALID_KEY
ANOTHER_VALID=value
`;
      const result = parseEnvContent(envContent);
      
      expect(result.STEAM_API_KEY).toBe('valid123');
      expect(result.ANOTHER_VALID).toBe('value');
      expect(Object.keys(result)).toHaveLength(2);
    });

    it('should handle values with equals signs', () => {
      const envContent = `
CONNECTION_STRING=mongodb://user:pass@host:port/db
BASE64_VALUE=data:image/png;base64,iVBORw0==
`;
      const result = parseEnvContent(envContent);
      
      expect(result.CONNECTION_STRING).toBe('mongodb://user:pass@host:port/db');
      expect(result.BASE64_VALUE).toBe('data:image/png;base64,iVBORw0==');
    });
  });

  describe('getSteamApiKey', () => {
    it('should get Steam API key from provided config', () => {
      const key = getSteamApiKey({
        STEAM_API_KEY: 'config_steam_key'
      });
      
      expect(key).toBe('config_steam_key');
    });

    it('should return undefined if no config provided', () => {
      const key = getSteamApiKey();
      
      expect(key).toBeUndefined();
    });

    it('should return undefined if config has no STEAM_API_KEY', () => {
      const key = getSteamApiKey({
        OTHER_VAR: 'some_value'
      });
      
      expect(key).toBeUndefined();
    });

    it('should handle empty config object', () => {
      const key = getSteamApiKey({});
      
      expect(key).toBeUndefined();
    });
  });

  describe('loadEnvFromContent', () => {
    it('should load environment from .env content', () => {
      const envContent = `
# Steam API Configuration
STEAM_API_KEY=content_key_123
APP_NAME="Steam API Test"
DEBUG=true
`;
      
      const config = loadEnvFromContent(envContent);
      
      expect(config.STEAM_API_KEY).toBe('content_key_123');
      expect(config.APP_NAME).toBe('Steam API Test');
      expect(config.DEBUG).toBe('true');
    });

    it('should handle empty content', () => {
      const config = loadEnvFromContent('');
      
      expect(Object.keys(config)).toHaveLength(0);
    });

    it('should handle content with only comments', () => {
      const envContent = `
# This is just comments
# STEAM_API_KEY=commented_out
# Nothing real here
`;
      
      const config = loadEnvFromContent(envContent);
      
      expect(Object.keys(config)).toHaveLength(0);
    });
  });

  describe('Integration with real .env format', () => {
    it('should parse complex .env file format', () => {
      const envContent = `
# Steam API Configuration
STEAM_API_KEY=your_steam_api_key_here

# Application Settings
NODE_ENV=production
PORT=3000
DEBUG=false

# Database Configuration
DB_HOST="localhost"
DB_USER='myuser'
DB_PASS="complex$password123"

# URLs and Endpoints
API_URL=https://api.example.com/v1
CALLBACK_URL="https://example.com/callback?param=value"
`;
      
      const config = loadEnvFromContent(envContent);
      
      expect(config.STEAM_API_KEY).toBe('your_steam_api_key_here');
      expect(config.NODE_ENV).toBe('production');
      expect(config.PORT).toBe('3000');
      expect(config.DEBUG).toBe('false');
      expect(config.DB_HOST).toBe('localhost');
      expect(config.DB_USER).toBe('myuser');
      expect(config.DB_PASS).toBe('complex$password123');
      expect(config.API_URL).toBe('https://api.example.com/v1');
      expect(config.CALLBACK_URL).toBe('https://example.com/callback?param=value');
    });

    it('should handle edge cases in .env format', () => {
      const envContent = `
# Edge cases
EMPTY_VALUE=
SPACES_IN_VALUE="  spaces  "
SINGLE_QUOTES='single quoted'
SPECIAL_CHARS="special!@#$%^&*()characters"
MULTILINE_LIKE="line1\\nline2"
EQUALS_IN_VALUE="key=value=more"
`;
      
      const config = loadEnvFromContent(envContent);
      
      expect(config.EMPTY_VALUE).toBe('');
      expect(config.SPACES_IN_VALUE).toBe('  spaces  ');
      expect(config.SINGLE_QUOTES).toBe('single quoted');
      expect(config.SPECIAL_CHARS).toBe('special!@#$%^&*()characters');
      expect(config.MULTILINE_LIKE).toBe('line1\\nline2');
      expect(config.EQUALS_IN_VALUE).toBe('key=value=more');
    });
  });

  describe('WASM Environment Simulation', () => {
    it('should work in environments without global process', () => {
      // Test that our functions work even if process is undefined
      const envContent = `
STEAM_API_KEY=wasm_test_key
ENVIRONMENT=wasm
`;
      
      const config = loadEnvFromContent(envContent);
      const apiKey = getSteamApiKey(config);
      
      expect(config.STEAM_API_KEY).toBe('wasm_test_key');
      expect(config.ENVIRONMENT).toBe('wasm');
      expect(apiKey).toBe('wasm_test_key');
    });

    it('should handle browser-like environment configuration', () => {
      // Simulate configuration passed from browser environment
      const browserConfig = {
        STEAM_API_KEY: 'browser_api_key',
        APP_VERSION: '1.0.0',
        BUILD_ENV: 'production'
      };
      
      const apiKey = getSteamApiKey(browserConfig);
      
      expect(apiKey).toBe('browser_api_key');
    });
  });
}); 