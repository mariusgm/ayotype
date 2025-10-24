/**
 * ConsentManager - GDPR/CCPA compliant consent management
 * Handles user preferences and vendor transparency
 */

import type { ConsentPreferences, ConsentState } from '../core/types';
import {
  saveConsent,
  loadConsent,
  clearConsent,
  getConsentState,
  hasAdConsent
} from '../utils/consent-storage';

export class ConsentManager {
  private listeners: Set<(state: ConsentState) => void> = new Set();
  private currentState: ConsentState = 'unknown';

  constructor() {
    this.currentState = getConsentState();
  }

  /**
   * Get current consent state
   */
  getState(): ConsentState {
    return this.currentState;
  }

  /**
   * Get full consent preferences
   */
  getPreferences(): ConsentPreferences | null {
    return loadConsent();
  }

  /**
   * Grant consent for all purposes
   */
  acceptAll(): void {
    this.setPreferences({
      state: 'granted',
      advertising: true,
      analytics: true,
      personalization: true
    });
  }

  /**
   * Deny consent for all purposes
   */
  rejectAll(): void {
    this.setPreferences({
      state: 'denied',
      advertising: false,
      analytics: false,
      personalization: false
    });
  }

  /**
   * Set custom preferences
   * @param preferences Partial consent preferences
   */
  setPreferences(preferences: Partial<ConsentPreferences>): void {
    saveConsent(preferences);

    const newState = preferences.state || 'partial';
    this.updateState(newState);
  }

  /**
   * Check if user has consented to advertising
   */
  hasAdConsent(): boolean {
    return hasAdConsent();
  }

  /**
   * Revoke consent (user requests data deletion)
   */
  revokeConsent(): void {
    clearConsent();
    this.updateState('unknown');
  }

  /**
   * Update consent state and notify listeners
   */
  private updateState(newState: ConsentState): void {
    if (newState !== this.currentState) {
      const oldState = this.currentState;
      this.currentState = newState;

      console.log(`[ConsentManager] State changed: ${oldState} → ${newState}`);

      // Notify all listeners
      this.listeners.forEach((listener) => {
        try {
          listener(newState);
        } catch (error) {
          console.error('[ConsentManager] Listener error:', error);
        }
      });
    }
  }

  /**
   * Subscribe to consent state changes
   * @param callback Function to call when state changes
   * @returns Unsubscribe function
   */
  onChange(callback: (state: ConsentState) => void): () => void {
    this.listeners.add(callback);

    // Call immediately with current state
    callback(this.currentState);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Check if consent banner should be shown
   * @returns True if user hasn't made a choice yet
   */
  shouldShowBanner(): boolean {
    return this.currentState === 'unknown';
  }
}

// Singleton instance
export const consentManager = new ConsentManager();
