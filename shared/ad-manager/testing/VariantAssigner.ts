/**
 * VariantAssigner - Stable user bucketing for A/B tests
 * Ensures same user always gets same variant
 */

import type { ABTest, ABTestVariant, UserAssignment } from '../core/types';
import { hashCode, generateUserId } from '../utils/hash';

export class VariantAssigner {
  private assignments: Map<string, UserAssignment> = new Map();
  private userId: string;

  constructor(userId?: string) {
    this.userId = userId || generateUserId();
    this.loadAssignments();
  }

  /**
   * Assign user to a variant for a given test
   * @param test A/B test configuration
   * @returns Assigned variant
   */
  assignVariant(test: ABTest): ABTestVariant {
    // Check if user already assigned
    const existing = this.assignments.get(test.id);
    if (existing) {
      const variant = test.variants.find((v) => v.id === existing.variantId);
      if (variant) {
        return variant;
      }
    }

    // Assign new variant based on hash
    const variant = this.selectVariant(test);

    // Store assignment
    const assignment: UserAssignment = {
      testId: test.id,
      variantId: variant.id,
      timestamp: Date.now()
    };

    this.assignments.set(test.id, assignment);
    this.saveAssignments();

    console.log(`[VariantAssigner] Assigned user ${this.userId} to variant ${variant.id} for test ${test.id}`);

    return variant;
  }

  /**
   * Select variant based on user ID and variant weights
   * @param test A/B test configuration
   * @returns Selected variant
   */
  private selectVariant(test: ABTest): ABTestVariant {
    // Create hash from test ID + user ID for deterministic selection
    const hash = hashCode(test.id + this.userId);

    // Normalize hash to 0-100 range (percentage)
    const bucket = hash % 100;

    // Select variant based on cumulative weights
    let cumWeight = 0;
    for (const variant of test.variants) {
      cumWeight += variant.weight;
      if (bucket < cumWeight) {
        return variant;
      }
    }

    // Fallback to first variant (shouldn't happen if weights sum to 100)
    return test.variants[0];
  }

  /**
   * Get current assignment for a test
   * @param testId Test ID
   * @returns User assignment or null
   */
  getAssignment(testId: string): UserAssignment | null {
    return this.assignments.get(testId) || null;
  }

  /**
   * Get user ID
   */
  getUserId(): string {
    return this.userId;
  }

  /**
   * Load assignments from storage
   */
  private loadAssignments(): void {
    try {
      const stored = localStorage.getItem('ayotype_ab_assignments');
      if (stored) {
        const data = JSON.parse(stored) as UserAssignment[];
        data.forEach((assignment) => {
          this.assignments.set(assignment.testId, assignment);
        });
      }
    } catch (error) {
      console.error('[VariantAssigner] Failed to load assignments:', error);
    }
  }

  /**
   * Save assignments to storage
   */
  private saveAssignments(): void {
    try {
      const data = Array.from(this.assignments.values());
      localStorage.setItem('ayotype_ab_assignments', JSON.stringify(data));
    } catch (error) {
      console.error('[VariantAssigner] Failed to save assignments:', error);
    }
  }

  /**
   * Clear all assignments (for testing)
   */
  clearAssignments(): void {
    this.assignments.clear();
    try {
      localStorage.removeItem('ayotype_ab_assignments');
    } catch {
      // Silently fail
    }
  }
}
