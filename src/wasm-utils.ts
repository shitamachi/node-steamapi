/**
 * WASM-compatible utility functions
 * Provides safe alternatives to Node.js-specific APIs
 */

/**
 * Safe console warning that works in environments without full console API
 * @param message Message to log
 */
export function safeWarn(message: string): void {
  if (typeof globalThis !== 'undefined' && 
      globalThis.console && 
      typeof globalThis.console.warn === 'function') {
    globalThis.console.warn(message);
  } else if (typeof console !== 'undefined' && 
             typeof console.warn === 'function') {
    console.warn(message);
  }
  // In WASM environments without console, silently ignore
}

/**
 * Check if URLSearchParams is available
 */
function isURLSearchParamsAvailable(): boolean {
  return typeof URLSearchParams !== 'undefined' && URLSearchParams !== null;
}

/**
 * Manual URL parameter encoding as fallback
 * @param params Object containing key-value pairs to encode
 * @returns URL-encoded query string
 */
function manualEncodeParams(params: Record<string, any>): string {
  const pairs: string[] = [];
  
  // Use for...in loop for better compatibility instead of Object.entries
  for (const key in params) {
    if (params.hasOwnProperty(key)) {
      const value = params[key];
      if (value !== undefined && value !== null) {
        const encodedKey = encodeURIComponent(key);
        let encodedValue: string;
        
        if (Array.isArray(value)) {
          encodedValue = encodeURIComponent(value.join(','));
        } else {
          encodedValue = encodeURIComponent(String(value));
        }
        
        pairs.push(`${encodedKey}=${encodedValue}`);
      }
    }
  }
  
  return pairs.join('&');
}

/**
 * URL parameter encoding function to replace Node.js querystring
 * @param params Object containing key-value pairs to encode
 * @returns URL-encoded query string
 */
export function encodeParams(params: Record<string, any>): string {
  // Try URLSearchParams first if available
  if (isURLSearchParamsAvailable()) {
    try {
      const searchParams = new URLSearchParams();
      
      // Use for...in loop for better compatibility instead of Object.entries
      for (const key in params) {
        if (params.hasOwnProperty(key)) {
          const value = params[key];
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              searchParams.append(key, value.join(','));
            } else {
              searchParams.append(key, String(value));
            }
          }
        }
      }
      
      return searchParams.toString();
    } catch (error) {
      // Fallback to manual encoding if URLSearchParams fails
      return manualEncodeParams(params);
    }
  }
  
  // Fallback to manual encoding
  return manualEncodeParams(params);
}

/**
 * Check if URL constructor is available and working
 */
function isURLConstructorAvailable(): boolean {
  try {
    return typeof URL !== 'undefined' && 
           URL !== null && 
           new URL('https://example.com') instanceof URL;
  } catch {
    return false;
  }
}

/**
 * Manual URL validation as fallback
 * @param url URL string to validate
 * @returns true if URL looks like valid HTTP/HTTPS
 */
function manualValidateUrl(url: string): boolean {
  if (typeof url !== 'string' || url.length === 0) {
    return false;
  }
  
  // Basic regex check for HTTP/HTTPS URLs
  const httpPattern = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;
  return httpPattern.test(url);
}

/**
 * URL validation function for security
 * @param url URL string to validate
 * @returns true if URL is valid HTTP/HTTPS
 */
export function isValidUrl(url: string): boolean {
  // Try URL constructor first if available
  if (isURLConstructorAvailable()) {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
    } catch {
      return false;
    }
  }
  
  // Fallback to manual validation
  return manualValidateUrl(url);
}

/**
 * Check if Date API is available and working
 */
function isDateApiAvailable(): boolean {
  try {
    return typeof Date !== 'undefined' && 
           Date !== null &&
           typeof Date.now === 'function' &&
           !isNaN(Date.now()) &&
           Date.now() > 0;
  } catch {
    return false;
  }
}

/**
 * Safe timestamp function with fallback for environments without Date.now()
 * @returns Current timestamp in milliseconds
 */
export function getTimestamp(): number {
  if (isDateApiAvailable()) {
    try {
      return Date.now();
    } catch {
      // Fall through to fallback
    }
  }
  
  // Try basic Date constructor
  try {
    if (typeof Date !== 'undefined') {
      return new Date().getTime();
    }
  } catch {
    // Fall through to static fallback
  }
  
  // Static fallback timestamp (2022-01-01 00:00:00 UTC)
  // This ensures the function always returns a valid number
  return 1640995200000;
}

/**
 * Safe Date.now() with fallback
 * @returns Current timestamp in milliseconds
 */
export function safeDateNow(): number {
  return getTimestamp();
} 