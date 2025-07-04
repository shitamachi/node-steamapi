// Use WASM-compatible fetch implementation
import { lazyFetch } from './fetch-impl.js';

// More robust error pattern matching for HTML error pages
const htmlErrorPatterns = [
	/<h1[^>]*>(.*?)<\/h1>/i,
	/<title[^>]*>(.*?)<\/title>/i,
	/<h2[^>]*>(.*?)<\/h2>/i
];

/**
 * Enhanced fetch wrapper with better error handling for Steam API
 * @param url Request URL
 * @param options Fetch options
 * @returns Parsed JSON response
 */
export async function fetch(url: string, options: any): Promise<any> {
	try {
	const res = await lazyFetch(url, options);
		
		// Handle specific Steam API error responses
	if (res.status === 400) {
		const data = await res.text();
			
			// Try to extract error message from HTML
			for (const pattern of htmlErrorPatterns) {
				const match = data.match(pattern);
				if (match) {
					throw new Error(match[1].trim());
				}
			}
			
			// Fallback to raw data if no pattern matches
			throw new Error(data || 'Bad Request');
	}

		if (!res.ok) {
			// The enhanced fetch already handles errors, but just in case
			throw new Error(`HTTP ${res.status}: ${res.statusText}`);
		}

	return res.json();
	} catch (error) {
		// Re-throw with additional context
		if (error instanceof Error) {
			const enhancedError = new Error(`Steam API request failed: ${error.message}`);
			(enhancedError as any).originalError = error;
			(enhancedError as any).url = url;
			throw enhancedError;
		}
		throw error;
	}
};

// App IDs are positive integers that are divisible by 10
const reID = /^\d{17}$/;

export function assertApp(apps: number | number[]): void {
	if (!Array.isArray(apps)) apps = [apps];
	if (apps.some(app => !(app > 0 && app % 1 === 0)))
		throw new TypeError('Invalid app ID provided');
}

// User IDs are 17 digit numbers
export function assertID(ids: string | string[]): void {
	if (!Array.isArray(ids)) ids = [ids];
	if (ids.some(id => !reID.test(id)))
		throw new TypeError('Invalid user ID provided');
}
