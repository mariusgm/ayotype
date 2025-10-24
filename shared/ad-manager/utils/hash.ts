/**
 * Hash utility for stable user bucketing in A/B tests
 * Uses simple hash function for deterministic assignment
 */

/**
 * Simple string hash function
 * @param str String to hash
 * @returns Hash code
 */
export function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Generate a stable user ID for A/B testing
 * Uses various browser fingerprints to create a semi-stable ID
 * @returns User ID string
 */
export function generateUserId(): string {
  // Try to get existing user ID from storage
  const stored = localStorage.getItem('ayotype_user_id');
  if (stored) {
    return stored;
  }

  // Generate new user ID based on browser fingerprint
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    new Date().getTimezoneOffset().toString(),
    screen.width + 'x' + screen.height,
    screen.colorDepth.toString()
  ].join('|');

  const userId = hashCode(fingerprint + Date.now().toString()).toString(36);

  // Store for future use
  try {
    localStorage.setItem('ayotype_user_id', userId);
  } catch {
    // Silently fail if localStorage not available
  }

  return userId;
}
