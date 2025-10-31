/**
 * Validation utilities for AyoType combo generation
 * Used for backend validation of generated combos
 */

import { fixSpacing } from './string';
import { levenshteinDistance } from './distance';

/**
 * Check if text contains both emoji and ASCII characters (hybrid mode)
 * Used to validate "both" mode combos
 *
 * @param text - Text to check
 * @returns True if text contains both emoji and ASCII emoticons
 */
export function isHybrid(text: string): boolean {
  // Check for emoji (Unicode emoji range)
  const hasEmoji = /[\u2190-\u2BFF\u2600-\u27BF\u{1F000}-\u{1FAFF}]/u.test(text);
  // Check for ASCII emoticons
  const hasAscii = /[\(\)^_¬°;:]/.test(text);
  return hasEmoji && hasAscii;
}

/**
 * Validate that text has 1-3 non-empty lines
 *
 * @param text - Text to validate
 * @returns True if text has between 1 and 3 non-empty lines
 */
export function validateLineCount(text: string): boolean {
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  return lines.length >= 1 && lines.length <= 3;
}

/**
 * Deduplicate combos by removing near-duplicates and invalid entries
 * - Fixes spacing issues
 * - Validates line count
 * - Enforces hybrid requirement for "both" mode
 * - Removes near-duplicates (Levenshtein distance < 5)
 *
 * @param combos - Array of combo objects with text/combo and name properties
 * @param mode - Generation mode ("emoji", "ascii", or "both")
 * @returns Filtered array of valid, unique combos
 */
export function dedupeCombos(combos: any[], mode: string): any[] {
  const result: any[] = [];

  for (const combo of combos) {
    // Fix spacing issues
    let text = fixSpacing(combo.combo || combo.text || "");

    // Validate line count
    if (!validateLineCount(text)) {
      continue;
    }

    // For combo mode (both), enforce hybrid requirement
    if (mode === "both" && !isHybrid(text)) {
      continue;
    }

    // Check for near-duplicates (Levenshtein distance < 5)
    const isDuplicate = result.some(existing => {
      const existingText = existing.combo || existing.text || "";
      return levenshteinDistance(text, existingText) < 5;
    });

    if (!isDuplicate) {
      result.push({
        combo: text,
        text: text,
        name: combo.name || "combo"
      });
    }
  }

  return result;
}
