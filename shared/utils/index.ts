/**
 * Shared utilities for AyoType monorepo
 * Barrel export file for convenient imports
 *
 * @example
 * import { cleanLine, fixSpacing, levenshteinDistance, isHybrid } from '@shared/utils';
 */

// String utilities
export { cleanLine, fixSpacing } from './string';

// Distance calculation
export { levenshteinDistance } from './distance';

// Cryptographic functions
export { sha256Base64 } from './crypto';

// Validation functions
export { isHybrid, validateLineCount, dedupeCombos } from './validation';

// Combo of the Day - Seasonal Events
export {
  detectSeasonalEvent,
  getSeasonalTheme,
  type SeasonalEvent,
  type SeasonalTheme
} from './seasonal-events';

// Combo of the Day - Formatting
export {
  formatComboText,
  validateComboLength,
  removeLineBreaks,
  truncateCombo
} from './combo-formatting';

// Combo of the Day - SEO Metadata
export {
  generateSEOMetadata,
  generateStructuredData,
  generateOpenGraphTags,
  generateTwitterCardTags,
  type SEOMetadata,
  type ComboData
} from './seo-metadata';
