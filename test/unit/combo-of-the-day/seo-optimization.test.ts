import { describe, it, expect } from 'vitest';

/**
 * TDD: SEO Optimization Tests
 *
 * These tests define expected SEO metadata generation for combo of the day.
 *
 * Write these tests FIRST, then implement the functions to make them pass.
 */

// Import functions we'll implement
import {
  generateSEOMetadata,
  generateStructuredData,
  generateOpenGraphTags,
  generateTwitterCardTags,
  type SEOMetadata
} from '../../../shared/utils/seo-metadata';

describe('SEO Optimization', () => {
  describe('generateSEOMetadata', () => {
    it('should generate complete SEO metadata for Halloween combo', () => {
      const comboData = {
        date: '2025-10-31',
        combo: '🎃👻🦇 spooky vibes',
        name: 'Halloween Special',
        theme: 'halloween night',
        tone: 'chaotic',
        description: 'Spooky and eerie halloween celebration'
      };

      const seo = generateSEOMetadata(comboData);

      expect(seo.title).toContain('Halloween');
      expect(seo.title).toContain('2025');
      expect(seo.description).toContain('spooky');
      expect(seo.keywords).toContain('Halloween');
      expect(seo.keywords).toContain('emoji');
    });

    it('should generate SEO title within 60 characters', () => {
      const comboData = {
        date: '2025-10-31',
        combo: '🎃 test',
        name: 'Test Combo',
        theme: 'test',
        tone: 'cool',
        description: 'Test description'
      };

      const seo = generateSEOMetadata(comboData);

      expect(seo.title.length).toBeLessThanOrEqual(60);
    });

    it('should generate SEO description within 160 characters', () => {
      const comboData = {
        date: '2025-10-31',
        combo: '🎃 test',
        name: 'Test Combo',
        theme: 'test',
        tone: 'cool',
        description: 'Test description that could be very long'
      };

      const seo = generateSEOMetadata(comboData);

      expect(seo.description.length).toBeLessThanOrEqual(160);
    });

    it('should include seasonal keywords in metadata', () => {
      const comboData = {
        date: '2025-10-31',
        combo: '🎃👻🦇',
        name: 'Halloween',
        theme: 'halloween night',
        tone: 'chaotic',
        description: 'Spooky vibes'
      };

      const seo = generateSEOMetadata(comboData);

      expect(seo.keywords).toContain('Halloween');
      expect(seo.keywords).toContain('October');
      expect(seo.keywords).toContain('emoji fusion');
    });

    it('should generate canonical URL', () => {
      const comboData = {
        date: '2025-10-31',
        combo: '🎃',
        name: 'Test',
        theme: 'test',
        tone: 'cool',
        description: 'Test'
      };

      const seo = generateSEOMetadata(comboData);

      expect(seo.canonical).toContain('ayotype.com');
      expect(seo.canonical).toContain('2025-10-31');
    });
  });

  describe('generateStructuredData', () => {
    it('should generate valid JSON-LD structured data', () => {
      const comboData = {
        date: '2025-10-31',
        combo: '🎃👻',
        name: 'Halloween',
        theme: 'halloween',
        tone: 'chaotic',
        description: 'Spooky'
      };

      const structured = generateStructuredData(comboData);

      expect(structured['@context']).toBe('https://schema.org');
      expect(structured['@type']).toBe('CreativeWork');
      expect(structured.name).toBeDefined();
      expect(structured.description).toBeDefined();
      expect(structured.datePublished).toBe('2025-10-31');
    });

    it('should include author information', () => {
      const comboData = {
        date: '2025-10-31',
        combo: '🎃',
        name: 'Test',
        theme: 'test',
        tone: 'cool',
        description: 'Test'
      };

      const structured = generateStructuredData(comboData);

      expect(structured.author).toBeDefined();
      expect(structured.author.name).toBe('EmojiFusion');
    });

    it('should include publisher information', () => {
      const comboData = {
        date: '2025-10-31',
        combo: '🎃',
        name: 'Test',
        theme: 'test',
        tone: 'cool',
        description: 'Test'
      };

      const structured = generateStructuredData(comboData);

      expect(structured.publisher).toBeDefined();
      expect(structured.publisher.name).toBe('Ayotype');
    });

    it('should include image URL if PNG exists', () => {
      const comboData = {
        date: '2025-10-31',
        combo: '🎃',
        name: 'Test',
        theme: 'test',
        tone: 'cool',
        description: 'Test',
        png_url: '/combo-of-the-day/2025-10-31.png'
      };

      const structured = generateStructuredData(comboData);

      expect(structured.image).toContain('combo-of-the-day/2025-10-31.png');
    });
  });

  describe('generateOpenGraphTags', () => {
    it('should generate Open Graph tags for social sharing', () => {
      const comboData = {
        date: '2025-10-31',
        combo: '🎃👻🦇',
        name: 'Halloween',
        theme: 'halloween',
        tone: 'chaotic',
        description: 'Spooky vibes'
      };

      const og = generateOpenGraphTags(comboData);

      expect(og['og:title']).toBeDefined();
      expect(og['og:description']).toBeDefined();
      expect(og['og:type']).toBe('article');
      expect(og['og:url']).toContain('ayotype.com');
    });

    it('should include image for social preview', () => {
      const comboData = {
        date: '2025-10-31',
        combo: '🎃',
        name: 'Test',
        theme: 'test',
        tone: 'cool',
        description: 'Test',
        png_url: '/combo-of-the-day/2025-10-31.png'
      };

      const og = generateOpenGraphTags(comboData);

      expect(og['og:image']).toContain('combo-of-the-day/2025-10-31.png');
      expect(og['og:image:width']).toBe('800');
      expect(og['og:image:height']).toBe('400');
    });

    it('should include site name', () => {
      const comboData = {
        date: '2025-10-31',
        combo: '🎃',
        name: 'Test',
        theme: 'test',
        tone: 'cool',
        description: 'Test'
      };

      const og = generateOpenGraphTags(comboData);

      expect(og['og:site_name']).toBe('Ayotype EmojiFusion');
    });
  });

  describe('generateTwitterCardTags', () => {
    it('should generate Twitter Card tags', () => {
      const comboData = {
        date: '2025-10-31',
        combo: '🎃👻',
        name: 'Halloween',
        theme: 'halloween',
        tone: 'chaotic',
        description: 'Spooky vibes'
      };

      const twitter = generateTwitterCardTags(comboData);

      expect(twitter['twitter:card']).toBe('summary_large_image');
      expect(twitter['twitter:title']).toBeDefined();
      expect(twitter['twitter:description']).toBeDefined();
    });

    it('should include image for Twitter preview', () => {
      const comboData = {
        date: '2025-10-31',
        combo: '🎃',
        name: 'Test',
        theme: 'test',
        tone: 'cool',
        description: 'Test',
        png_url: '/combo-of-the-day/2025-10-31.png'
      };

      const twitter = generateTwitterCardTags(comboData);

      expect(twitter['twitter:image']).toContain('combo-of-the-day/2025-10-31.png');
    });

    it('should include site handle', () => {
      const comboData = {
        date: '2025-10-31',
        combo: '🎃',
        name: 'Test',
        theme: 'test',
        tone: 'cool',
        description: 'Test'
      };

      const twitter = generateTwitterCardTags(comboData);

      expect(twitter['twitter:site']).toBe('@ayotype');
    });
  });

  describe('SEO Best Practices', () => {
    it('should not use stop words in titles', () => {
      const comboData = {
        date: '2025-10-31',
        combo: '🎃',
        name: 'The Best Halloween of the Day',
        theme: 'halloween',
        tone: 'chaotic',
        description: 'Test'
      };

      const seo = generateSEOMetadata(comboData);

      // Should minimize "the", "of", "a", etc.
      const stopWordCount = (seo.title.match(/\b(the|of|a|an|and|or)\b/gi) || []).length;
      expect(stopWordCount).toBeLessThan(3);
    });

    it('should include trending keywords for seasonal events', () => {
      const comboData = {
        date: '2025-10-31',
        combo: '🎃👻',
        name: 'Halloween',
        theme: 'halloween',
        tone: 'chaotic',
        description: 'Spooky'
      };

      const seo = generateSEOMetadata(comboData);

      const trendingKeywords = ['Halloween 2025', 'spooky emoji', 'halloween aesthetic'];
      const hasTrendingKeyword = trendingKeywords.some(keyword =>
        seo.keywords.toLowerCase().includes(keyword.toLowerCase())
      );

      expect(hasTrendingKeyword).toBe(true);
    });

    it('should generate unique metadata for each date', () => {
      const combo1 = {
        date: '2025-10-31',
        combo: '🎃',
        name: 'Halloween',
        theme: 'halloween',
        tone: 'chaotic',
        description: 'Spooky'
      };

      const combo2 = {
        date: '2025-11-01',
        combo: '🍂',
        name: 'Fall',
        theme: 'autumn',
        tone: 'nostalgic',
        description: 'Cozy'
      };

      const seo1 = generateSEOMetadata(combo1);
      const seo2 = generateSEOMetadata(combo2);

      expect(seo1.title).not.toBe(seo2.title);
      expect(seo1.description).not.toBe(seo2.description);
    });
  });
});
