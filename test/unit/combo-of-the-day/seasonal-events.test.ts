import { describe, it, expect } from 'vitest';

/**
 * TDD: Seasonal Event Detection Tests
 *
 * These tests define the expected behavior for detecting seasonal events
 * and generating appropriate combo themes.
 *
 * Write these tests FIRST, then implement the functions to make them pass.
 */

// Import the functions we'll implement (will fail initially - that's expected!)
import {
  detectSeasonalEvent,
  getSeasonalTheme,
  type SeasonalEvent
} from '../../../shared/utils/seasonal-events';

describe('Seasonal Event Detection', () => {
  describe('detectSeasonalEvent', () => {
    it('should detect Halloween on October 31', () => {
      const date = new Date('2025-10-31');
      const event = detectSeasonalEvent(date);

      expect(event).toBeDefined();
      expect(event?.name).toBe('Halloween');
      expect(event?.keywords).toContain('spooky');
      expect(event?.keywords).toContain('trick-or-treat');
    });

    it('should detect Christmas period (Dec 20-26)', () => {
      const christmasEve = new Date('2025-12-24');
      const christmasDay = new Date('2025-12-25');

      const event1 = detectSeasonalEvent(christmasEve);
      const event2 = detectSeasonalEvent(christmasDay);

      expect(event1?.name).toBe('Christmas');
      expect(event2?.name).toBe('Christmas');
      expect(event1?.keywords).toContain('festive');
    });

    it('should detect New Year period (Dec 31 - Jan 1)', () => {
      const newYearEve = new Date('2025-12-31');
      const newYearDay = new Date('2026-01-01');

      const event1 = detectSeasonalEvent(newYearEve);
      const event2 = detectSeasonalEvent(newYearDay);

      expect(event1?.name).toBe('New Year');
      expect(event2?.name).toBe('New Year');
      expect(event1?.keywords).toContain('celebration');
    });

    it('should detect Valentine\'s Day (Feb 14)', () => {
      const date = new Date('2025-02-14');
      const event = detectSeasonalEvent(date);

      expect(event?.name).toBe('Valentine\'s Day');
      expect(event?.keywords).toContain('love');
      expect(event?.keywords).toContain('hearts');
    });

    it('should detect Summer season (Jun-Aug)', () => {
      const juneDate = new Date('2025-06-15');
      const julyDate = new Date('2025-07-15');
      const augustDate = new Date('2025-08-15');

      const event1 = detectSeasonalEvent(juneDate);
      const event2 = detectSeasonalEvent(julyDate);
      const event3 = detectSeasonalEvent(augustDate);

      expect(event1?.name).toBe('Summer');
      expect(event2?.name).toBe('Summer');
      expect(event3?.name).toBe('Summer');
    });

    it('should detect Fall/Autumn season (Sep-Nov)', () => {
      const septDate = new Date('2025-09-15');
      const event = detectSeasonalEvent(septDate);

      expect(event?.name).toBe('Fall');
      expect(event?.keywords).toContain('autumn');
    });

    it('should detect Winter season (Dec-Feb)', () => {
      const janDate = new Date('2025-01-15');
      const febDate = new Date('2025-02-05'); // Not Valentine's

      const event1 = detectSeasonalEvent(janDate);
      const event2 = detectSeasonalEvent(febDate);

      expect(event1?.name).toBe('Winter');
      expect(event2?.name).toBe('Winter');
    });

    it('should detect Spring season (Mar-May)', () => {
      const marchDate = new Date('2025-03-15');
      const event = detectSeasonalEvent(marchDate);

      expect(event?.name).toBe('Spring');
      expect(event?.keywords).toContain('blooming');
    });

    it('should return null for no specific event', () => {
      // Regular day with no special event
      const date = new Date('2025-04-10');
      const event = detectSeasonalEvent(date);

      // Should still return a seasonal theme (Spring) but not a special event
      expect(event).toBeDefined();
      expect(event?.name).toBe('Spring');
      expect(event?.priority).toBe('low');
    });

    it('should prioritize holidays over seasons', () => {
      // Halloween (high priority) should override Fall season
      const halloween = new Date('2025-10-31');
      const event = detectSeasonalEvent(halloween);

      expect(event?.name).toBe('Halloween');
      expect(event?.priority).toBe('high');
    });
  });

  describe('getSeasonalTheme', () => {
    it('should return Halloween theme with appropriate tone', () => {
      const date = new Date('2025-10-31');
      const theme = getSeasonalTheme(date);

      expect(theme.name).toMatch(/halloween|spooky|haunted/i);
      expect(theme.tone).toBe('chaotic');
      expect(theme.description).toMatch(/spooky|eerie|haunted/i);
      expect(theme.words).toMatch(/halloween|spooky|ghost|pumpkin/i);
    });

    it('should return Christmas theme with festive tone', () => {
      const date = new Date('2025-12-25');
      const theme = getSeasonalTheme(date);

      expect(theme.name).toMatch(/christmas|festive|holiday/i);
      expect(theme.tone).toBe('cute');
      expect(theme.words).toMatch(/christmas|festive|jolly|merry/i);
    });

    it('should return Summer theme for summer dates', () => {
      const date = new Date('2025-07-15');
      const theme = getSeasonalTheme(date);

      expect(theme.name).toMatch(/summer|beach|sunny/i);
      expect(theme.tone).toBe('romantic');
      expect(theme.description).toMatch(/warm|sunny|bright/i);
    });

    it('should return Fall theme for autumn dates', () => {
      const date = new Date('2025-09-15');
      const theme = getSeasonalTheme(date);

      expect(theme.name).toMatch(/fall|autumn/i);
      expect(theme.description).toMatch(/cozy|colorful|crisp/i);
    });

    it('should include SEO-friendly keywords in theme', () => {
      const date = new Date('2025-10-31');
      const theme = getSeasonalTheme(date);

      expect(theme.seoKeywords).toBeDefined();
      expect(theme.seoKeywords).toContain('Halloween');
      expect(theme.seoKeywords.length).toBeGreaterThan(3);
    });
  });
});
