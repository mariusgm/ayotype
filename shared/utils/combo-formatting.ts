/**
 * Combo Formatting Utility
 *
 * Ensures combo text is properly formatted without cutoffs or line breaks.
 * Provides validation and truncation functions for display.
 */

/**
 * Format combo text by removing line breaks and normalizing whitespace
 */
export function formatComboText(text: string): string {
  if (!text) return '';

  return text
    // Remove all line breaks (LF, CR, CRLF)
    .replace(/\r?\n|\r/g, ' ')
    // Normalize multiple spaces to single space
    .replace(/\s+/g, ' ')
    // Trim leading/trailing whitespace
    .trim();
}

/**
 * Remove line breaks from text, replacing with spaces
 */
export function removeLineBreaks(text: string): string {
  if (!text) return '';

  return text
    .replace(/\r?\n|\r/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Validate combo length
 * @param combo - The combo text to validate
 * @param maxLength - Maximum allowed length (default: 60)
 * @returns true if combo is within length limit
 */
export function validateComboLength(combo: string, maxLength: number = 60): boolean {
  if (!combo) return true;

  // Use string length which handles emoji correctly in modern JS
  return combo.length <= maxLength;
}

/**
 * Truncate combo text to a maximum length
 * Attempts to truncate at word boundary and not split emoji
 *
 * @param combo - The combo text to truncate
 * @param maxLength - Maximum allowed length (default: 60)
 * @returns Truncated combo with ellipsis if needed
 */
export function truncateCombo(combo: string, maxLength: number = 60): string {
  if (!combo || combo.length <= maxLength) {
    return combo;
  }

  // Need to add ellipsis (' ...'), so effective max is maxLength - 4
  const effectiveMax = maxLength - 4;

  // Try to find last word boundary before max length
  let truncated = combo.substring(0, effectiveMax);

  // Find last space within the truncated string
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > effectiveMax * 0.8) {
    // If we found a space relatively close to the end, use it
    // This ensures we don't end mid-word
    truncated = truncated.substring(0, lastSpace);
  }

  // Clean up any partial emoji at the end
  truncated = cleanPartialEmoji(truncated);

  // Ensure we end with a space before ellipsis (not mid-word)
  const trimmed = truncated.trim();

  return trimmed + ' ...';
}

/**
 * Clean partial emoji from end of string
 * Emoji can be represented as surrogate pairs in UTF-16
 */
function cleanPartialEmoji(text: string): string {
  if (!text) return '';

  // Check if last character is a high surrogate without its pair
  const lastChar = text.charCodeAt(text.length - 1);

  // High surrogates are in range 0xD800-0xDBFF
  if (lastChar >= 0xD800 && lastChar <= 0xDBFF) {
    // Remove the incomplete surrogate pair
    return text.substring(0, text.length - 1);
  }

  // Check if first character is a low surrogate without its pair
  const firstChar = text.charCodeAt(0);

  // Low surrogates are in range 0xDC00-0xDFFF
  if (firstChar >= 0xDC00 && firstChar <= 0xDFFF) {
    // Remove the incomplete surrogate pair
    return text.substring(1);
  }

  return text;
}
