/**
 * String utility functions for AyoType
 * Used across API and frontend for consistent string handling
 */

/**
 * Clean a string by removing control characters and truncating to max length
 * @param s - Input string to clean
 * @param max - Maximum length (default: 60)
 * @returns Cleaned and truncated string
 */
export function cleanLine(s: string, max = 60): string {
  return s.replace(/[\x00-\x1F]/g, "").slice(0, max).trim();
}

/**
 * Fix spacing issues in combo text
 * - Replaces <3 with heart emoji
 * - Fixes spacing in emoticons (: D → :D)
 * - Collapses multiple spaces
 * - Trims whitespace
 *
 * @param text - Input text with potential spacing issues
 * @returns Fixed text with proper spacing
 */
export function fixSpacing(text: string): string {
  return text
    .replace(/<3/g, '❤️')                    // Replace <3 with heart emoji
    .replace(/:\s+D/g, ':D')                 // Fix : D → :D
    .replace(/;\s+\)/g, ';)')                // Fix ; ) → ;)
    .replace(/\(\s+\^/g, '(^')               // Fix ( ^ → (^
    .replace(/\s{2,}/g, ' ')                 // Collapse multiple spaces
    .trim();                                  // Remove leading/trailing whitespace
}
