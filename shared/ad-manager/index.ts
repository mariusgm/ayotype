/**
 * AyoType Ad Manager - Main exports
 * Modular, performance-optimized ad integration system
 */

// Core
export { AdManager } from './core/AdManager';
export { adLoader, AdLoader } from './core/AdLoader';
export * from './core/types';

// Containers
export { AdContainer, AdSkipLink } from './containers/AdContainer';
export { SidebarAd } from './containers/SidebarAd';
export { InFeedAd } from './containers/InFeedAd';
export { AnchorAd } from './containers/AnchorAd';

// Consent Management
export { ConsentManager, consentManager } from './consent/ConsentManager';
export { ConsentBanner } from './consent/ConsentBanner';
export * from './utils/consent-storage';

// A/B Testing
export { ABTestManager, EXAMPLE_TESTS } from './testing/ABTestManager';
export { VariantAssigner } from './testing/VariantAssigner';

// Utilities
export { LazyLoader, createAdLazyLoader } from './utils/lazy-load';
export { hashCode, generateUserId } from './utils/hash';
