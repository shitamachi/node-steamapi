/**
 * WASM-compatible environment variable utilities
 * Supports parsing .env files and environment configurations
 */

export interface EnvConfig {
  STEAM_API_KEY?: string;
  [key: string]: string | undefined;
}

/**
 * Simple .env file parser that works in WASM environments
 * @param envContent Content of .env file as string
 * @returns Parsed environment variables object
 */
export function parseEnvContent(envContent: string): EnvConfig {
  const env: EnvConfig = {};
  
  // Split into lines and process each line
  const lines = envContent.split('\n');
  
  for (const line of lines) {
    // Skip empty lines and comments
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    
    // Find the first = character
    const equalIndex = trimmed.indexOf('=');
    if (equalIndex === -1 || equalIndex === 0) {
      continue;
    }
    
    const key = trimmed.slice(0, equalIndex).trim();
    let value = trimmed.slice(equalIndex + 1).trim();
    
    // Skip if key is empty
    if (!key) {
      continue;
    }
    
    // Remove quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    
    env[key] = value;
  }
  
  return env;
}

/**
 * Get Steam API key from environment configuration
 * @param envConfig Environment config object (required in WASM environments)
 * @returns Steam API key or undefined
 */
export function getSteamApiKey(envConfig?: EnvConfig): string | undefined {
  return envConfig?.STEAM_API_KEY;
}

/**
 * WASM-compatible .env file content loader
 * @param envFileContent Content of .env file as string
 * @returns Parsed environment configuration
 */
export function loadEnvFromContent(envFileContent: string): EnvConfig {
  return parseEnvContent(envFileContent);
} 