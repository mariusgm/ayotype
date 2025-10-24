/**
 * Core type definitions for AyoType Ad Manager
 * Comprehensive types for ad placement, consent, testing, and analytics
 */

// ===== Consent Management =====

export type ConsentState = 'unknown' | 'granted' | 'denied' | 'partial';

export interface ConsentPreferences {
  state: ConsentState;
  advertising: boolean;
  analytics: boolean;
  personalization: boolean;
  timestamp: number;
  version: string; // Consent policy version
}

export interface Vendor {
  id: string;
  name: string;
  policyUrl: string;
  purposes: string[]; // e.g., ['advertising', 'analytics']
}

// ===== Ad Configuration =====

export type AdPosition =
  | 'header'
  | 'sidebar'
  | 'in-feed'
  | 'footer'
  | 'anchor';

export type AdFormat =
  | 'display'
  | 'native'
  | 'video'
  | 'responsive';

export interface AdSize {
  width: number;
  height: number;
  label?: string; // e.g., 'Medium Rectangle', 'Leaderboard'
}

export interface AdSlot {
  id: string;
  position: AdPosition;
  format: AdFormat;
  sizes: AdSize[];
  lazyLoad: boolean;
  priority: number; // Higher = loads first
  minViewportWidth?: number; // Min screen width to show this ad
  maxViewportWidth?: number; // Max screen width to show this ad
}

export interface AdUnit {
  slot: AdSlot;
  element: HTMLElement | null;
  loaded: boolean;
  visible: boolean;
  error: Error | null;
}

// ===== A/B Testing =====

export interface ABTestVariant {
  id: string;
  weight: number; // Percentage (0-100)
  config: Record<string, any>; // Variant-specific config
}

export interface ABTest {
  id: string;
  name: string;
  variants: ABTestVariant[];
  metrics: string[]; // e.g., ['ctr', 'bounce_rate', 'rpm']
  startDate: string; // ISO 8601
  endDate: string; // ISO 8601
  active: boolean;
}

export interface UserAssignment {
  testId: string;
  variantId: string;
  timestamp: number;
}

// ===== Performance Monitoring =====

export interface PerformanceMetrics {
  cls: number; // Cumulative Layout Shift
  lcp: number; // Largest Contentful Paint (ms)
  fid: number; // First Input Delay (ms)
  tbt: number; // Total Blocking Time (ms)
}

export interface AdMetrics {
  impressions: number;
  clicks: number;
  ctr: number; // Click-through rate (clicks/impressions)
  viewability: number; // % of ad visible for 1s+
  rpm: number; // Revenue per 1000 impressions
  loadTime: number; // Time to load ad (ms)
}

export interface AdAnalytics {
  adId: string;
  position: AdPosition;
  format: AdFormat;
  performance: PerformanceMetrics;
  engagement: AdMetrics;
  timestamp: number;
}

// ===== Ad Manager Configuration =====

export interface AdManagerConfig {
  publisherId: string; // Google AdSense publisher ID
  testMode: boolean; // Show placeholder ads instead of real ads
  consentRequired: boolean; // Require consent before loading ads
  lazyLoadThreshold: number; // IntersectionObserver rootMargin (px)
  performanceBudget: {
    maxCLS: number; // Max CLS increase from ads
    maxLCPDelay: number; // Max LCP delay in ms
    maxBundleSize: number; // Max JS bundle size (bytes)
  };
  abTesting: {
    enabled: boolean;
    userIdKey: string; // localStorage key for stable user IDs
  };
}

// ===== Events =====

export type AdEventType =
  | 'ad-requested'
  | 'ad-loaded'
  | 'ad-error'
  | 'ad-impression'
  | 'ad-click'
  | 'consent-granted'
  | 'consent-denied'
  | 'test-assigned';

export interface AdEvent {
  type: AdEventType;
  adId?: string;
  position?: AdPosition;
  data?: Record<string, any>;
  timestamp: number;
}

// ===== Error Handling =====

export class AdError extends Error {
  constructor(
    message: string,
    public adId: string,
    public code: string,
    public recoverable: boolean = true
  ) {
    super(message);
    this.name = 'AdError';
  }
}

// ===== Utility Types =====

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

export interface ResponsiveConfig<T> {
  mobile?: T;
  tablet?: T;
  desktop?: T;
}
