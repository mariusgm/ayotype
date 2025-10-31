/**
 * Distance calculation utilities for AyoType
 * Used for detecting near-duplicate combos
 */

/**
 * Calculate Levenshtein distance between two strings
 * Measures the minimum number of single-character edits (insertions, deletions, or substitutions)
 * required to change one string into another.
 *
 * Used to detect near-duplicate combos (if distance < 5, considered duplicate)
 *
 * @param a - First string
 * @param b - Second string
 * @returns Levenshtein distance (number of edits)
 *
 * @example
 * levenshteinDistance('hello', 'hallo') // 1 (one substitution)
 * levenshteinDistance('🎉 party', '🎉 party!') // 1 (one insertion)
 */
export function levenshteinDistance(a: string, b: string): number {
  // Create 2D matrix to store distances
  const matrix: number[][] = [];

  // Initialize first column (distance from empty string to b[0..i])
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  // Initialize first row (distance from empty string to a[0..j])
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        // Characters match - no edit needed
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        // Characters don't match - take minimum of three operations
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  // Return bottom-right cell (distance between full strings)
  return matrix[b.length][a.length];
}
