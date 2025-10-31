/**
 * Cryptographic utilities for AyoType
 * Used for cache key generation and hashing
 */

/**
 * Hash a string using SHA-256 and encode as Base64
 * Used for generating cache keys from request payloads
 *
 * @param s - Input string to hash
 * @returns Promise resolving to Base64-encoded SHA-256 hash
 *
 * @example
 * const cacheKey = "cache:" + await sha256Base64(JSON.stringify(payload));
 */
export async function sha256Base64(s: string): Promise<string> {
  // Convert string to Uint8Array
  const buffer = new TextEncoder().encode(s);

  // Compute SHA-256 hash
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);

  // Convert ArrayBuffer to Uint8Array
  const hashArray = new Uint8Array(hashBuffer);

  // Convert to Base64
  const base64 = btoa(String.fromCharCode(...Array.from(hashArray)));

  return base64;
}
