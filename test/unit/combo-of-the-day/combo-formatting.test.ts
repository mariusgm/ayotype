import { describe, it, expect } from 'vitest';

/**
 * TDD: Combo Formatting Tests
 *
 * These tests ensure combos are properly formatted without cutoffs or line breaks.
 *
 * Write these tests FIRST, then implement the functions to make them pass.
 */

// Import functions we'll implement
import {
  formatComboText,
  validateComboLength,
  removeLineBreaks,
  truncateCombo
} from '../../../shared/utils/combo-formatting';

describe('Combo Formatting', () => {
  describe('formatComboText', () => {
    it('should remove internal line breaks', () => {
      const input = "flow\n(＾▽＾)\nfree";
      const result = formatComboText(input);

      expect(result).not.toContain('\n');
      expect(result).toBe("flow (＾▽＾) free");
    });

    it('should remove carriage returns', () => {
      const input = "test\r\ncombo\rtext";
      const result = formatComboText(input);

      expect(result).not.toContain('\r');
      expect(result).not.toContain('\n');
    });

    it('should normalize multiple spaces to single space', () => {
      const input = "flow    (＾▽＾)   free";
      const result = formatComboText(input);

      expect(result).toBe("flow (＾▽＾) free");
    });

    it('should trim leading and trailing whitespace', () => {
      const input = "  flow (＾▽＾) free  ";
      const result = formatComboText(input);

      expect(result).toBe("flow (＾▽＾) free");
    });

    it('should preserve emoji spacing', () => {
      const input = "✨ (^_^) ✨";
      const result = formatComboText(input);

      expect(result).toBe("✨ (^_^) ✨");
    });

    it('should handle complex Unicode correctly', () => {
      const input = "🌈🦄💻 cyber vibes";
      const result = formatComboText(input);

      expect(result).toBe("🌈🦄💻 cyber vibes");
    });
  });

  describe('validateComboLength', () => {
    it('should accept combos under 60 characters', () => {
      const combo = "✨ (^_^) daily vibes";
      const isValid = validateComboLength(combo);

      expect(isValid).toBe(true);
    });

    it('should accept combos at exactly 60 characters', () => {
      const combo = "a".repeat(60);
      const isValid = validateComboLength(combo);

      expect(isValid).toBe(true);
    });

    it('should reject combos over 60 characters', () => {
      const combo = "a".repeat(61);
      const isValid = validateComboLength(combo);

      expect(isValid).toBe(false);
    });

    it('should handle emoji character length correctly', () => {
      // Emoji should count as 1-2 characters, not more
      const combo = "🎃👻🦇 spooky halloween vibes tonight";
      const isValid = validateComboLength(combo);

      expect(isValid).toBe(true);
    });

    it('should allow custom max length', () => {
      const combo = "test combo text";
      const isValid = validateComboLength(combo, 10);

      expect(isValid).toBe(false);
    });
  });

  describe('removeLineBreaks', () => {
    it('should remove all types of line breaks', () => {
      const input = "line1\nline2\rline3\r\nline4";
      const result = removeLineBreaks(input);

      expect(result).toBe("line1 line2 line3 line4");
    });

    it('should preserve single spaces when removing breaks', () => {
      const input = "word1\nword2";
      const result = removeLineBreaks(input);

      expect(result).toBe("word1 word2");
    });

    it('should handle empty strings', () => {
      const result = removeLineBreaks("");

      expect(result).toBe("");
    });

    it('should handle strings with only line breaks', () => {
      const input = "\n\r\n\r";
      const result = removeLineBreaks(input);

      expect(result).toBe("");
    });
  });

  describe('truncateCombo', () => {
    it('should not truncate short combos', () => {
      const combo = "short text";
      const result = truncateCombo(combo, 60);

      expect(result).toBe("short text");
    });

    it('should truncate long combos at max length', () => {
      const combo = "a".repeat(70);
      const result = truncateCombo(combo, 60);

      expect(result.length).toBeLessThanOrEqual(60);
    });

    it('should add ellipsis when truncating', () => {
      const combo = "a".repeat(70);
      const result = truncateCombo(combo, 60);

      expect(result).toMatch(/\.\.\.$/);
    });

    it('should truncate at word boundary', () => {
      const combo = "one two three four five six seven eight nine ten";
      const result = truncateCombo(combo, 25);

      // Should end with complete word, not mid-word
      expect(result).not.toMatch(/\w\.\.\.$/);
      expect(result).toMatch(/\s\.\.\.$/);
    });

    it('should not split emoji when truncating', () => {
      const combo = "text text text 🎃👻🦇 more text";
      const result = truncateCombo(combo, 20);

      // Result should either include full emoji or exclude it entirely
      const hasPartialEmoji = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(result);
      expect(hasPartialEmoji).toBe(false);
    });

    it('should handle custom max length', () => {
      const combo = "a".repeat(50);
      const result = truncateCombo(combo, 30);

      expect(result.length).toBeLessThanOrEqual(30);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty combo text', () => {
      const result = formatComboText("");

      expect(result).toBe("");
    });

    it('should handle combo with only whitespace', () => {
      const result = formatComboText("   \n\t\r   ");

      expect(result).toBe("");
    });

    it('should handle combo with mixed Unicode', () => {
      const combo = "🎃 spöökÿ hållöween 👻 vibes";
      const result = formatComboText(combo);

      expect(result).toContain("spöökÿ");
      expect(result).toContain("hållöween");
    });

    it('should handle combo with ASCII art', () => {
      const combo = "(╯°□°)╯︵ ┻━┻";
      const result = formatComboText(combo);

      expect(result).toBe("(╯°□°)╯︵ ┻━┻");
    });
  });
});
