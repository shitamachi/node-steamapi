/**
 * WASM-compatible fetch implementation
 * Supports multiple environments: global fetch, self.fetch (Web Workers), and proper error handling
 */

let fetchImpl: typeof fetch | null = null;

/**
 * Load fetch implementation from available sources
 * Priority: globalThis.fetch > self.fetch > window.fetch > throw error
 */
async function loadFetchImpl(): Promise<typeof fetch> {
  // Check globalThis first (most universal)
  if (typeof globalThis !== 'undefined' && typeof globalThis.fetch === 'function') {
    return globalThis.fetch.bind(globalThis);
  }

  // Check self (Web Workers, Service Workers)
  if (typeof self !== 'undefined' && typeof self.fetch === 'function') {
    return self.fetch.bind(self);
  }

  // Check window (browsers)
  if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
    return window.fetch.bind(window);
  }

  // Last resort: check global fetch
  if (typeof fetch === 'function') {
    return fetch;
  }

  throw new Error('No fetch implementation available. This environment does not support fetch API.');
}

/**
 * Enhanced error handling for fetch responses
 * Tries JSON parsing first, falls back to text for HTML error pages
 */
async function handleFetchError(response: Response, url: string): Promise<never> {
  let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
  
  try {
    // Try to parse as JSON first (Steam API often returns JSON errors)
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const errorData = await response.json();
      if (errorData.error || errorData.message) {
        errorMessage = errorData.error || errorData.message;
      }
  } else {
      // For HTML error pages, try to extract title or use status text
      const text = await response.text();
      const titleMatch = text.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch) {
        errorMessage = titleMatch[1].trim();
      }
    }
  } catch {
    // If parsing fails, stick with the original status message
  }

  const error = new Error(`Fetch failed for ${url}: ${errorMessage}`);
  (error as any).status = response.status;
  (error as any).statusText = response.statusText;
  throw error;
}

/**
 * Enhanced fetch wrapper with better error handling and environment detection
 */
export async function lazyFetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
  if (!fetchImpl) {
    fetchImpl = await loadFetchImpl();
  }

  const url = typeof input === 'string' ? input : input.url;

  try {
    const response = await fetchImpl(input, init);
    
    // For non-2xx responses, provide enhanced error information
    if (!response.ok) {
      await handleFetchError(response, url);
    }

    return response;
  } catch (error) {
    // Re-throw with context if it's our enhanced error
    if (error instanceof Error && 'status' in error) {
      throw error;
    }

    // For network errors or other issues, provide context
    const enhancedError = new Error(`Network error for ${url}: ${error instanceof Error ? error.message : String(error)}`);
    (enhancedError as any).originalError = error;
    throw enhancedError;
  }
}

/**
 * Check if fetch is available in the current environment
 */
export function isFetchAvailable(): boolean {
  return (typeof globalThis !== 'undefined' && typeof globalThis.fetch === 'function') ||
         (typeof self !== 'undefined' && typeof self.fetch === 'function') ||
         (typeof window !== 'undefined' && typeof window.fetch === 'function') ||
         (typeof fetch === 'function');
}
