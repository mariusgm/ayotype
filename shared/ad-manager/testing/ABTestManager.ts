/**
 * ABTestManager - Orchestrates A/B testing for ad optimization
 * Manages active tests, variant assignment, and metric tracking
 */

import type { ABTest, ABTestVariant } from '../core/types';
import { VariantAssigner } from './VariantAssigner';

export class ABTestManager {
  private assigner: VariantAssigner;
  private activeTests: Map<string, ABTest> = new Map();
  private variantCache: Map<string, ABTestVariant> = new Map();

  constructor(userId?: string) {
    this.assigner = new VariantAssigner(userId);
  }

  /**
   * Register a test
   * @param test A/B test configuration
   */
  registerTest(test: ABTest): void {
    // Validate test configuration
    if (!this.validateTest(test)) {
      console.error('[ABTestManager] Invalid test configuration:', test);
      return;
    }

    // Check if test is currently active
    if (!this.isTestActive(test)) {
      console.log(`[ABTestManager] Test ${test.id} is not active yet or has ended`);
      return;
    }

    this.activeTests.set(test.id, test);
    console.log(`[ABTestManager] Registered test: ${test.id}`, test);
  }

  /**
   * Get variant for a test
   * @param testId Test ID
   * @returns Variant configuration or null if test not found
   */
  getVariant(testId: string): ABTestVariant | null {
    // Check cache first
    if (this.variantCache.has(testId)) {
      return this.variantCache.get(testId)!;
    }

    // Get test
    const test = this.activeTests.get(testId);
    if (!test) {
      console.warn(`[ABTestManager] Test ${testId} not found`);
      return null;
    }

    // Assign variant
    const variant = this.assigner.assignVariant(test);
    this.variantCache.set(testId, variant);

    return variant;
  }

  /**
   * Check if test is currently active
   * @param test A/B test configuration
   * @returns True if test is within start/end dates
   */
  private isTestActive(test: ABTest): boolean {
    const now = new Date();
    const start = new Date(test.startDate);
    const end = new Date(test.endDate);

    return now >= start && now <= end && test.active;
  }

  /**
   * Validate test configuration
   * @param test A/B test configuration
   * @returns True if valid
   */
  private validateTest(test: ABTest): boolean {
    // Check required fields
    if (!test.id || !test.name || !test.variants || test.variants.length < 2) {
      return false;
    }

    // Check variant weights sum to 100
    const totalWeight = test.variants.reduce((sum, v) => sum + v.weight, 0);
    if (totalWeight !== 100) {
      console.error(`[ABTestManager] Variant weights must sum to 100 (got ${totalWeight})`);
      return false;
    }

    // Check each variant has unique ID
    const ids = new Set(test.variants.map((v) => v.id));
    if (ids.size !== test.variants.length) {
      console.error('[ABTestManager] Variant IDs must be unique');
      return false;
    }

    return true;
  }

  /**
   * Get all active tests
   */
  getActiveTests(): ABTest[] {
    return Array.from(this.activeTests.values());
  }

  /**
   * Track metric for a test variant
   * @param testId Test ID
   * @param metricName Metric name (e.g., 'ctr', 'bounce_rate')
   * @param value Metric value
   */
  trackMetric(testId: string, metricName: string, value: number): void {
    const variant = this.variantCache.get(testId);
    if (!variant) {
      console.warn(`[ABTestManager] No variant found for test ${testId}`);
      return;
    }

    // In a real implementation, send to analytics service
    console.log('[ABTestManager] Metric tracked:', {
      testId,
      variantId: variant.id,
      metric: metricName,
      value
    });

    // TODO: Send to analytics endpoint
    // Example: fetch('/api/analytics/ab-test', { method: 'POST', body: JSON.stringify({ ... }) })
  }

  /**
   * Get user ID
   */
  getUserId(): string {
    return this.assigner.getUserId();
  }

  /**
   * Clear all test assignments (for testing/debugging)
   */
  clearAssignments(): void {
    this.assigner.clearAssignments();
    this.variantCache.clear();
    console.log('[ABTestManager] Cleared all assignments');
  }
}

/**
 * Example test configurations
 */
export const EXAMPLE_TESTS: ABTest[] = [
  {
    id: 'sidebar_presence_2025_10',
    name: 'Landing Page Sidebar Presence',
    variants: [
      {
        id: 'control',
        weight: 50,
        config: { showSidebar: false }
      },
      {
        id: 'treatment',
        weight: 50,
        config: { showSidebar: true }
      }
    ],
    metrics: ['ctr', 'bounce_rate', 'time_on_page', 'rpm'],
    startDate: '2025-10-25T00:00:00Z',
    endDate: '2025-11-25T23:59:59Z',
    active: true
  },
  {
    id: 'ad_density_2025_10',
    name: 'Ad Density Optimization',
    variants: [
      {
        id: 'low_density',
        weight: 33,
        config: { maxAdsPerPage: 2 }
      },
      {
        id: 'medium_density',
        weight: 34,
        config: { maxAdsPerPage: 3 }
      },
      {
        id: 'high_density',
        weight: 33,
        config: { maxAdsPerPage: 4 }
      }
    ],
    metrics: ['ctr', 'rpm', 'bounce_rate'],
    startDate: '2025-10-25T00:00:00Z',
    endDate: '2025-11-30T23:59:59Z',
    active: false // Not started yet
  }
];
